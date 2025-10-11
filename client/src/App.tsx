import React from "react"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { SearchBar } from "@/components/search-bar"
import { FilterSidebar, type RecipeFilters } from "@/components/filters"
import { RecipeCard } from "@/components/recipe-card"
import UploadIngredientsDialog from "@/components/UploadIngredientsDialog"
import {type Recipe} from "@/types"

function isIngredient(obj: any): boolean {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.name === "string" &&
    typeof obj.quantity === "number" &&
    typeof obj.unit === "string" &&
    (obj.optional === undefined || typeof obj.optional === "boolean") &&
    (obj.substitutes === undefined || Array.isArray(obj.substitutes))
  )
}

function isRecipe(obj: any): obj is Recipe {
  if (!obj || typeof obj !== "object") return false

  // allow either _id or id from backend; normalize requirement to have at least one identifier
  if (!(typeof obj._id === "string" || typeof obj.id === "string")) return false
  if (typeof obj.title !== "string") return false
  if (typeof obj.description !== "string") return false
  if (typeof obj.image !== "string") return false
  if (typeof obj.cuisine !== "string") return false
  if (!Array.isArray(obj.ingredients) || !obj.ingredients.every(isIngredient)) return false
  if (!Array.isArray(obj.instructions) || !obj.instructions.every((s: any) => typeof s === "string")) return false
  if (typeof obj.servings !== "number") return false
  if (typeof obj.cookTimeMinutes !== "number") return false
  if (!["easy", "medium", "hard"].includes(obj.difficulty)) return false
  if (!Array.isArray(obj.dietary) || !obj.dietary.every((d: any) => typeof d === "string")) return false
  if (
    !obj.nutritionPerServing ||
    typeof obj.nutritionPerServing.calories !== "number" ||
    typeof obj.nutritionPerServing.protein !== "number" ||
    typeof obj.nutritionPerServing.fat !== "number" ||
    typeof obj.nutritionPerServing.carbs !== "number"
  ) {
    return false
  }
  return true
}

function isRecipeArray(arr: any): arr is Recipe[] {
  return Array.isArray(arr) && arr.every(isRecipe)
}

type SearchPayload = {
  terms: string[]
  filters: RecipeFilters
}

const fetcher = async (_key: string, payload: SearchPayload) => {
  const res = await fetch("/api/recipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    throw new Error("Failed to fetch recipes")
  }
  const body = await res.json()

  // Expecting { recipes: Recipe[] } — validate at runtime
  if (!body || !Array.isArray(body.recipes) || !isRecipeArray(body.recipes)) {
    throw new Error("Invalid recipe data")
  }

  // If server used 'id' instead of '_id', normalize each item to include _id for consistency
  const normalized = body.recipes.map((r: any) => {
    if (!r._id && r.id) {
      return { ...r, _id: r.id }
    }
    return r
  })

  return { recipes: normalized as Recipe[] }
}

export default function App() {
  const [terms, setTerms] = React.useState<string[]>([])
  const [filters, setFilters] = React.useState<RecipeFilters>({
    time: "any",
    difficulty: "any",
    dietary: [],
    caloriesMin: "",
    caloriesMax: "",
    servings: 1,
    cuisines: [],
  })

  // Add generation state to avoid repeated calls
  const [generating, setGenerating] = React.useState(false)
  const [generatedOnce, setGeneratedOnce] = React.useState(false)

  const payload: SearchPayload = React.useMemo(() => ({ terms, filters }), [terms, filters])

  // Tell SWR the data shape for better typing
  const { data, error, isLoading, mutate } = useSWR<{ recipes: Recipe[] }, Error>(
    ["recipes-search", payload],
    ([key, p]) => fetcher(key, p),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  )

  // Trigger generation when there are zero recipes (only once per query)
  React.useEffect(() => {
    if (isLoading || error) return
    if (generatedOnce) return
    if (!data) return
    if (Array.isArray(data.recipes) && data.recipes.length === 0) {
      setGenerating(true)
      // request server to generate N recipes (adjust n as you prefer)
      const n = 1

      async function sendGenerateRequest(n: number) {
        const candidates = [
          "/api/generate-recipes", // relative (works when dev proxy or same origin)
          "http://localhost:5000/api/generate-recipes", // common backend fallback
        ]

        for (const url of candidates) {
          try {
            console.log(`Attempting recipe generation POST -> ${url}`)
            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ n }),
            })
            if (!res.ok) {
              const txt = await res.text().catch(() => "<no body>")
              console.warn(`Generate endpoint at ${url} returned ${res.status}:`, txt)
              continue
            }
            const json = await res.json().catch((e) => {
              console.warn("Failed to parse JSON from generate response:", e)
              return null
            })
            return json
          } catch (err) {
            console.warn(`Network error when POSTing to ${url}:`, err)
            // try next candidate
          }
        }
        return null
      }
      ;(async () => {
        try {
          console.log("Requesting generation of recipes...")
          const body = await sendGenerateRequest(n)
          if (!body) {
            console.error("All generation attempts failed or returned no usable response")
            return
          }
          // server returns { recipes: [...] } — validate
          if (body && Array.isArray(body.recipes) && isRecipeArray(body.recipes)) {
            // normalize ids to _id if necessary
            const normalized = body.recipes.map((r: any) => (!r._id && r.id ? { ...r, _id: r.id } : r))
            // update SWR cache so UI shows generated recipes
            await mutate({ recipes: normalized }, false)
          } else if (Array.isArray(body.recipes)) {
            // try to coerce items that look like recipes
            const coerced = body.recipes.map((r: any) => (!r._id && r.id ? { ...r, _id: r.id } : r))
            await mutate({ recipes: coerced }, false)
          } else if (Array.isArray(body)) {
            // in case older server returned raw array
            const coerced = body.map((r: any) => (!r._id && r.id ? { ...r, _id: r.id } : r))
            await mutate({ recipes: coerced }, false)
          } else {
            console.warn("Generate endpoint returned unexpected shape:", body)
          }
        } catch (e) {
          console.error("Failed to generate recipes:", e)
        } finally {
          setGenerating(false)
          setGeneratedOnce(true)
        }
      })()
    }
  }, [data, isLoading, error, mutate, generatedOnce])

  return (
    <main className="min-h-dvh">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-pretty text-2xl font-semibold">Generate Recipes</h1>
          <p className="mt-1 text-muted-foreground">Search and filter ingredients just like shopping for products.</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1">
              <SearchBar
                terms={terms}
                onAddTerm={(t) => {
                  const term = t.trim()
                  if (!term) return
                  setTerms((prev) => (prev.includes(term) ? prev : [...prev, term]))
                }}
                onRemoveTerm={(term) => setTerms((prev) => prev.filter((t) => t !== term))}
                onClearAll={() => setTerms([])}
              />
            </div>
            <div className="flex items-center gap-3">
              <UploadIngredientsDialog onAdd={(name) => {
                const term = name.toLowerCase()
                setTerms((prev) => (prev.includes(term) ? prev : [...prev, term]))
              }} />
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-lg font-medium">Filters</h2>
              <p className="mb-4 text-sm text-muted-foreground">Refine your search.</p>
              <FilterSidebar value={filters} onChange={setFilters} />
            </div>
          </aside>

          {/* Results */}
          <div className="md:col-span-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? "Loading recipes..."
                  : error
                    ? "Error loading recipes."
                    : `${data?.recipes?.length ?? 0} recipes`}
              </p>
              {terms.length > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Showing results for: <span className="font-medium">{terms.join(", ")}</span>
                </p>
              ) : (
                <span className="sr-only">{"No specific search terms"}</span>
              )}
            </div>

            <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3")}>
                {/* uploaded/recognized ingredients panel removed - uploads add terms directly to the search */}
              {/* If no results, trigger generation and show a generating message */}
              {!isLoading && !error && data?.recipes?.length === 0 && (
                <div className="col-span-full rounded-md border border-border bg-card p-6 text-center">
                  <p className="text-sm text-muted-foreground">Generating recipes, please wait...</p>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="h-[180px] animate-pulse rounded-lg bg-muted" />
                    <div className="h-[180px] animate-pulse rounded-lg bg-muted" />
                    <div className="h-[180px] animate-pulse rounded-lg bg-muted" />
                  </div>
                </div>
              )}

              {data?.recipes?.map((r: Recipe) => (
                <RecipeCard key={r._id ?? (r as any).id} recipe={r} />
              ))}

              {isLoading && (
                <>
                  <div className="h-[260px] animate-pulse rounded-lg bg-muted" />
                  <div className="h-[260px] animate-pulse rounded-lg bg-muted" />
                  <div className="h-[260px] animate-pulse rounded-lg bg-muted" />
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
