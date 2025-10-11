import dotenv from 'dotenv'
dotenv.config()

import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb" // new import
import { GoogleGenAI, Type } from "@google/genai"


const app = express()
app.use(cors())
app.use(bodyParser.json())

function matchesTerms(texts: string[], terms: string[]) {
  if (terms.length === 0) return true
  const hay = texts.join(" ").toLowerCase()
  return terms.every((t) => hay.includes(t.toLowerCase()))
}

function matchesTime(minutes: number, time: string) {
  switch (time) {
    case "<15":
      return minutes < 15
    case "15-30":
      return minutes >= 15 && minutes <= 30
    case "30-60":
      return minutes > 30 && minutes <= 60
    case ">60":
      return minutes > 60
    default:
      return true
  }
}

function matchesDifficulty(diff: string, want: string) {
  return want === "any" ? true : diff === want
}

function matchesDietary(recipeTags: string[], want: string[]) {
  if (want.length === 0) return true
  return want.every((tag) => recipeTags.includes(tag))
}

function matchesCalories(cal: number, minStr?: string, maxStr?: string) {
  const min = minStr ? Number(minStr) : undefined
  const max = maxStr ? Number(maxStr) : undefined
  if (Number.isFinite(min as number) && cal < (min as number)) return false
  if (Number.isFinite(max as number) && cal > (max as number)) return false
  return true
}

function matchesCuisine(cuisine: string, selected: string[]) {
  if (selected.length === 0) return true
  return selected.includes(cuisine)
}

// --- New MongoDB connection setup ---
const MONGO_URI =
  process.env.MONGO_URI || "mongodb+srv://praveen:a@cluster0.hukruti.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

const DB_NAME = process.env.DB_NAME || "recipeDb"
const COLLECTION_NAME = process.env.COLLECTION_NAME || "recipes"

console.log("Mongo URI:", MONGO_URI)

let mongoClient: MongoClient | null = null
let recipesCollection: any = null
let countersCollection: any = null

async function connectToMongo() {
  // Pass recommended options; driver will ignore unknown options on modern versions.
  // mongoClient = new MongoClient(MONGO_URI, {
  //   // keep these for compatibility; modern driver uses these semantics by default
  //   useNewUrlParser: true as any,
  //   useUnifiedTopology: true as any,
  // })

  // assign to outer mongoClient (avoid shadowing)
  mongoClient = new MongoClient(MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  try {
    await mongoClient.connect()
  } catch (err) {
    console.error("MongoDB connection error:", err)
    throw err
  }
  const db = mongoClient.db(DB_NAME)
  recipesCollection = db.collection(COLLECTION_NAME)
  countersCollection = db.collection("counters")
  console.log(`✅ Connected to MongoDB ${MONGO_URI} (db: ${DB_NAME}, collection: ${COLLECTION_NAME})`)
}

// Update route to fetch from MongoDB instead of RECIPES import
app.post("/api/recipes", async (req: express.Request, res: express.Response) => {
  const body = req.body
  const terms: string[] = Array.isArray(body?.terms) ? body.terms : []
  const filters = body?.filters ?? {}
  console.log("Search request:", { terms, filters })

  if (!recipesCollection) {
    return res.status(500).json({ error: "Database not initialized" })
  }

  try {
    // For simplicity fetch documents and apply existing in-memory filters.
    // If your collection is large, consider building a MongoDB query instead.
    const docs = await recipesCollection.find({}).toArray()
    const results = docs.filter((r: any) => {
      const termOk = matchesTerms([r.title, r.description, (r.ingredients || []).join(" ")], terms)
      const timeOk = matchesTime(r.cookTimeMinutes ?? 0, filters.time ?? "any")
      const diffOk = matchesDifficulty(r.difficulty ?? "any", filters.difficulty ?? "any")
      const dietOk = matchesDietary(r.dietary ?? [], Array.isArray(filters.dietary) ? filters.dietary : [])
      const calOk = matchesCalories(r.calories ?? 0, filters.caloriesMin, filters.caloriesMax)
      const cuiOk = matchesCuisine(r.cuisine ?? "", Array.isArray(filters.cuisines) ? filters.cuisines : [])
      return termOk && timeOk && diffOk && dietOk && calOk && cuiOk
    })

    res.json({ recipes: results })
  } catch (err) {
    console.error("Error fetching recipes:", err)
    res.status(500).json({ error: "Failed to fetch recipes" })
  }
})

// Add endpoint to fetch a single recipe by MongoDB _id
app.get("/api/recipes/:id", async (req: express.Request, res: express.Response) => {
  const id = req.params.id
  console.log("Fetching recipe with id:", id)
  if (!recipesCollection) {
    return res.status(500).json({ error: "Database not initialized" })
  }
  if (!id) {
    return res.status(400).json({ error: "Missing id parameter" })
  }

  try {
    const doc = await recipesCollection.findOne({ _id: id })
    if (!doc) return res.status(404).json({ error: "Recipe not found" })
    res.json({ recipe: doc })
  } catch (err) {
    console.error("Error fetching recipe by id:", err)
    res.status(500).json({ error: "Failed to fetch recipe" })
  }
})

// helper: extract ingredient names from documents (supports strings or { name: string } objects)
function extractIngredientNamesFromDocs(docs: any[]): string[] {
  const names = new Set<string>()
  for (const d of docs) {
    const ingredients = d?.ingredients ?? []
    if (Array.isArray(ingredients)) {
      for (const ing of ingredients) {
        if (!ing) continue
        if (typeof ing === "string") {
          names.add(ing)
        } else if (typeof ing === "object" && ing.name) {
          names.add(String(ing.name))
        } else if (typeof ing === "object") {
          // attempt to find a plausible key
          const possible = Object.values(ing).find((v) => typeof v === "string")
          if (possible) names.add(String(possible))
        }
      }
    }
  }
  return Array.from(names)
}

// helper: extract existing recipe titles from docs
function extractExistingTitles(docs: any[]): string[] {
  return docs.map((d) => d?.title).filter(Boolean)
}

// minimal Gemini-only model caller using @google/genai
async function callGenerativeModel(prompt: string, n = 1): Promise<string> {
  const apiKey = process.env.GENAI_API_KEY || "AIzaSyABLzG0PzellKVq72gV2DWk_4To0v_T2uM"
  const model = process.env.GENAI_MODEL || "gemini-2.5-flash"

  if (!apiKey) throw new Error("Missing GENAI_API_KEY env var")

  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    // you can add additional config here if needed
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          _id: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          image: { type: Type.STRING },
          cuisine: { type: Type.STRING },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                substitutes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                // 'optional' removed; model-level optionality handled via top-level required array
              },
              required: ["name", "quantity", "unit"],
              propertyOrdering: ["name", "quantity", "unit", "substitutes"],
            },
          },
          instructions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          servings: { type: Type.NUMBER },
          cookTimeMinutes: { type: Type.NUMBER },
          prepTimeMinutes: { type: Type.NUMBER }, // optional at top-level (see required list below)
          difficulty: {
            type: Type.STRING,
            enum: ["easy", "medium", "hard"],
          },
          dietary: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
              enum: [
                "vegetarian",
                "vegan",
                "gluten-free",
                "dairy-free",
                "nut-free",
                "halal",
                "kosher",
              ],
            },
          },
          nutritionPerServing: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              fat: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
            },
            required: ["calories", "protein", "fat", "carbs"],
            propertyOrdering: ["calories", "protein", "fat", "carbs"],
          },
          ratings: {
            type: Type.OBJECT,
            properties: {
              avg: { type: Type.NUMBER },
              count: { type: Type.NUMBER },
            },
            required: ["avg", "count"],
            propertyOrdering: ["avg", "count"],
            // ratings is optional at the top level (see required list below)
          },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            // tags is optional at the top level
          },
        },
        // Top-level required: exclude fields that were optional in your TS type:
        // prepTimeMinutes, ratings, tags were optional; everything else required.
        required: [
          "_id",
          "title",
          "description",
          "image",
          "cuisine",
          "ingredients",
          "instructions",
          "servings",
          "cookTimeMinutes",
          "difficulty",
          "dietary",
          "nutritionPerServing"
        ],
        propertyOrdering: [
          "_id",
          "title",
          "description",
          "image",
          "cuisine",
          "ingredients",
          "instructions",
          "servings",
          "cookTimeMinutes",
          "prepTimeMinutes",
          "difficulty",
          "dietary",
          "nutritionPerServing",
          "ratings",
          "tags",
        ],
      }

    }
  })

  // preferred text field per example; fallback to JSON stringify
  return (response as any).text ?? JSON.stringify(response)
}

// New endpoint: generate recipes
app.post("/api/generate-recipes", async (req: express.Request, res: express.Response) => {
  const body = req.body ?? {}
  const n = Number(body?.n ?? 1)
  if (!recipesCollection) {
    return res.status(500).json({ error: "Database not initialized" })
  }
  try {
    // fetch docs to derive available ingredients and existing recipes
    const docs = await recipesCollection.find({}).toArray()
    const ingredients = extractIngredientNamesFromDocs(docs)
    const existing_recipes = extractExistingTitles(docs)

    // build prompt similar to the Python script
    const context_message = [
      "You are a recipe generation engine.",
      `We provide the following available ingredients :\n${JSON.stringify(ingredients)}`,
      "We already have these recipes in our dataset (do not duplicate or produce near-identical recipes):",
      `${JSON.stringify(existing_recipes)}`,
      `Please generate exactly ${n} new, distinct recipes that can be prepared using some subset of the available ingredients.`,
      "Each returned item must strictly follow the provided JSON schema named 'Recipe' (fields, types), and must include realistic quantities, servings, cook/prep times, difficulty (easy|medium|hard), dietary tags where applicable, and nutritionPerServing.",
      "Return the result as a JSON array of Recipe objects (no extra text).",
    ].join("\n\n")

    // If no API key is set, return the prompt and data so the client can call the model externally
    // call the model
    let rawOutput: string
    try {
      rawOutput = await callGenerativeModel(context_message, n)
    } catch (err: any) {
      console.error("Model call failed:", err)
      return res.status(502).json({ error: "Model call failed", detail: String(err) })
    }
    console.log("Model raw output:", rawOutput)

    // Try to parse the model output as JSON array
    let parsed: any
    try {
      // often the model returns plain JSON array; sometimes it includes code fences - remove them
      const cleaned = rawOutput.replace(/```json|```/g, "").trim()
      parsed = JSON.parse(cleaned)
      if (!Array.isArray(parsed)) {
        throw new Error("Parsed output is not an array")
      }
    } catch (err) {
      console.error("Failed to parse model output as JSON:", err, "raw:", rawOutput)
      return res.status(502).json({
        error: "Failed to parse model output as JSON array",
        raw: rawOutput,
        detail: String(err),
      })
    }

    // Optionally: basic validation (ensure each item has at least title & ingredients)
    const validated = parsed.map((p: any) => {
      return {
        _raw: p,
        ok: !!p?.title && Array.isArray(p?.ingredients),
      }
    })

    // Insert generated recipes into MongoDB (remove any incoming id/_id so Mongo assigns new ones)
    try {
      // compute sequential numeric ids using an atomic counter document
      const count = parsed.length
      if (count > 0) {
        if (!countersCollection) {
          // fallback: try to get collection handle if not initialized
          countersCollection = mongoClient!.db(DB_NAME).collection("counters")
        }
        // increment the sequence by the number of docs to insert
        const seqDoc = await countersCollection.findOneAndUpdate(
          { _id: "recipes" },
          { $inc: { seq: count } },
          { upsert: true, returnDocument: "after" as any }
        )
        const seqAfter = seqDoc?.value?.seq ?? count
        const start = seqAfter - count + 1

        const docsToInsert = parsed.map((p: any, i: number) => {
          const doc: any = { ...p }
          // remove any prior id fields
          delete doc._id
          delete doc.id
          const numId = start + i
          doc.id = numId
          // keep _id as string of numeric id so other code expecting string _id continues to work
          doc._id = String(numId)
          return doc
        })

        // use ordered: false so one bad doc doesn't stop the rest
        const insertResult = await recipesCollection.insertMany(docsToInsert, { ordered: false })
        console.log("Inserted generated recipes:", insertResult.insertedCount)
        // return the inserted docs (they already contain id and _id as string)
        parsed = docsToInsert
      }
    } catch (err: any) {
      // Log insertion failures but do not fail the whole response — still return generated content
      console.error("Failed to insert generated recipes into DB:", err)
    }

    // Return the parsed recipes (client may further validate/clean)
    res.json({ recipes: parsed, validationSummary: validated })
  } catch (err) {
    console.error("Error generating recipes:", err)
    res.status(500).json({ error: "Failed to generate recipes", detail: String(err) })
  }
})

const PORT = Number(process.env.PORT ?? 5000)

// Start server after Mongo is connected
connectToMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ API server running on http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB, exiting:", err)
    process.exit(1)
  })

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down...")
  if (mongoClient) await mongoClient.close()
  process.exit(0)
})
process.on("SIGTERM", async () => {
  console.log("Shutting down...")
  if (mongoClient) await mongoClient.close()
  process.exit(0)
})
