// src/pages/RecipePage.tsx
import React from "react"
import { useParams, Link } from "react-router-dom"
import { cn } from "../lib/utils"
import { type Recipe } from "@/types"

// fetcher for SWR that surfaces HTTP status and handles invalid JSON
const API_URL = import.meta.env.VITE_API_URL

function isString(v: any): v is string {
  return typeof v === "string"
}
function isNumber(v: any): v is number {
  return typeof v === "number" && Number.isFinite(v)
}
function isStringArray(v: any): v is string[] {
  return Array.isArray(v) && v.every(isString)
}

function isRecipe(obj: any): obj is Recipe {
  if (!obj || typeof obj !== "object") return false
  if (!isString(obj._id)) return false
  if (!isString(obj.title) || !isString(obj.description)) return false
  if (!isString(obj.image) || !isString(obj.cuisine)) return false
  if (!Array.isArray(obj.ingredients)) return false
  if (!obj.ingredients.every((it: any) =>
    it && isString(it.name) && isNumber(it.quantity) && isString(it.unit) &&
    (it.optional === undefined || typeof it.optional === "boolean") &&
    (it.substitutes === undefined || isStringArray(it.substitutes))
  )) return false
  if (!Array.isArray(obj.instructions) || !obj.instructions.every(isString)) return false
  if (!isNumber(obj.servings) || !isNumber(obj.cookTimeMinutes)) return false
  if (obj.prepTimeMinutes !== undefined && !isNumber(obj.prepTimeMinutes)) return false
  if (!["easy", "medium", "hard"].includes(obj.difficulty)) return false
  const allowedDiet = ["vegetarian","vegan","gluten-free","dairy-free","nut-free","halal","kosher"]
  if (!Array.isArray(obj.dietary) || !obj.dietary.every((d: any) => allowedDiet.includes(d))) return false
  if (!obj.nutritionPerServing || !isNumber(obj.nutritionPerServing.calories) || !isNumber(obj.nutritionPerServing.protein) || !isNumber(obj.nutritionPerServing.fat) || !isNumber(obj.nutritionPerServing.carbs)) return false
  if (obj.ratings !== undefined) {
    if (!isNumber(obj.ratings.avg) || !isNumber(obj.ratings.count)) return false
  }
  if (obj.tags !== undefined && !isStringArray(obj.tags)) return false
  return true
}

export default function RecipePage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState<boolean>(true)

  // Fetch the recipe by id
  React.useEffect(() => {
    if (!id) return

    const fetchRecipe = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_URL}/api/recipes/${id}`)
        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.message || "Failed to fetch recipe")
        }
        const json = await res.json()
        setData(json)
      } catch (err: any) {
        setError(err.message || "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchRecipe()
  }, [id])

  // servings state must be declared unconditionally (Rules of Hooks)
  const [servings, setServings] = React.useState<number>(1)

  // initialize servings from fetched recipe once validated
  React.useEffect(() => {
    if (!data || !data.recipe) return
    try {
      const maybeRecipe = data.recipe
      if (isRecipe(maybeRecipe)) {
        const base = maybeRecipe.servings || 1
        setServings((prev) => (prev !== base ? base : prev))
      }
    } catch {
      // no-op
    }
  }, [data])

  if (loading) {
    // simple loading state while fetching
    return <main className="mx-auto max-w-5xl px-4 py-6">Loading...</main>
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </main>
    )
  }

  const recipeRaw = data?.recipe

  if (!isRecipe(recipeRaw)) {
    console.error("Fetched recipe does not match expected shape:", recipeRaw)
    return (
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          Invalid recipe data received from server.
        </div>
      </main>
    )
  }

  const recipe = recipeRaw

  return (
    <main>
      {/* Replace Next.js <Image> with <img> */}
      <section className="relative h-64 w-full md:h-80">
        <img
          src={recipe.image || "/placeholder.svg"}
          alt={recipe.title}
          className="object-cover w-full h-full"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/30 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 mx-auto max-w-5xl">
          <h1 className="text-pretty text-2xl font-semibold md:text-3xl">
            {recipe.title}
          </h1>
        </div>
      </section>

      {/* Back button uses react-router <Link> */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium">⭐ 4.5</span>
                <span className="text-muted-foreground">(120 reviews)</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-secondary px-2 py-1 text-secondary-foreground">
                  {recipe.cuisine}
                </span>
                <span className="rounded-full bg-secondary px-2 py-1 text-secondary-foreground">
                  {recipe.difficulty[0].toUpperCase() + recipe.difficulty.slice(1)}
                </span>
                <span className="rounded-full bg-secondary px-2 py-1 text-secondary-foreground">
                  {recipe.cookTimeMinutes} min
                </span>
                {recipe?.dietary?.slice(0, 4).map((d: string) => (
                  <span key={d} className="rounded-full bg-secondary px-2 py-1 text-secondary-foreground">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm hover:opacity-90"
              >
                ← Back to results
              </Link>
              <button className="rounded-md border border-input bg-background px-3 py-2 text-sm hover:opacity-90">
                ❤️ Save
              </button>
              <button className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90">
                🔗 Share
              </button>
            </div>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Avg. calories per serving:{" "}
            <span className="font-medium">{recipe.nutritionPerServing.calories} kcal</span>
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 md:col-span-2">
            <ServingSize
              caloriesPerServing={recipe.nutritionPerServing.calories}
              servings={servings}
              setServings={setServings}
            />
            <IngredientsList
              ingredients={recipe.ingredients}
              servings={servings}
              baseServings={recipe.servings || 1}
            />
            <Instructions cookTimeMinutes={recipe.cookTimeMinutes} steps={recipe.instructions} />
          </div>
 
          {/* Sidebar */}
          <aside className="space-y-6">
            <NutritionCard nutritionPerServing={recipe.nutritionPerServing} servings={servings} />
            <Substitutions />
          </aside>
        </div>
      </section>
    </main>
  )
}



function SectionCard({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-card", className)}>
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  )
}

function NutritionCard({ nutritionPerServing, servings }: { nutritionPerServing: { calories: number; protein: number; fat: number; carbs: number }; servings: number }) {
  const totals = {
    calories: nutritionPerServing.calories * servings,
    protein: nutritionPerServing.protein * servings,
    carbs: nutritionPerServing.carbs * servings,
    fat: nutritionPerServing.fat * servings,
  }
  const fmt = (n: number) => (Math.abs(n - Math.round(n)) < 1e-6 ? String(Math.round(n)) : String(parseFloat(n.toFixed(2))))
  return (
    <SectionCard title="Nutritional Information">
      <table className="w-full text-sm">
        <tbody>
          <tr className="border-b border-border/70">
            <td className="py-2 text-muted-foreground">{"Calories (per serving)"}</td>
            <td className="py-2 text-right font-medium">{nutritionPerServing.calories} kcal</td>
          </tr>
          <tr className="border-b border-border/70">
            <td className="py-2 text-muted-foreground">{"Calories (total)"}</td>
            <td className="py-2 text-right font-medium">{fmt(totals.calories)} kcal</td>
          </tr>
          <tr className="border-b border-border/70">
            <td className="py-2 text-muted-foreground">{"Protein (total)"}</td>
            <td className="py-2 text-right font-medium">{fmt(totals.protein)} g</td>
          </tr>
          <tr className="border-b border-border/70">
            <td className="py-2 text-muted-foreground">{"Carbohydrates (total)"}</td>
            <td className="py-2 text-right font-medium">{fmt(totals.carbs)} g</td>
          </tr>
          <tr>
            <td className="py-2 text-muted-foreground">{"Fat (total)"}</td>
            <td className="py-2 text-right font-medium">{fmt(totals.fat)} g</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">{"Per-serving and total nutrition are shown; totals scale with servings."}</p>
    </SectionCard>
  )
}

function Substitutions() {
  const items = [
    { from: "Butter", to: "Olive oil", ratio: "1:1" },
    { from: "Heavy cream", to: "Coconut milk", ratio: "1:1" },
    { from: "Soy sauce", to: "Tamari", ratio: "1:1" },
  ]
  return (
    <SectionCard title="Substitution Suggestions">
      <details className="text-sm">
        <summary className="cursor-pointer select-none">{"View common swaps"}</summary>
        <ul className="mt-3 list-disc pl-5">
          {items.map((i) => (
            <li key={i.from}>
              <span className="font-medium">{i.from}</span> {"→"} {i.to}{" "}
              <span className="text-muted-foreground">({i.ratio})</span>
            </li>
          ))}
        </ul>
      </details>
    </SectionCard>
  )
}

function useIsClient() {
  const [isClient, setIsClient] = React.useState(false)
  React.useEffect(() => setIsClient(true), [])
  return isClient
}

function ServingSize({
  caloriesPerServing,
  servings,
  setServings,
}: {
  caloriesPerServing: number
  servings: number
  setServings: React.Dispatch<React.SetStateAction<number>>
}) {
  const isClient = useIsClient()
  if (!isClient)
    return (
      <SectionCard title="Serving Size">
        <div className="h-16 animate-pulse rounded-md bg-muted" />
      </SectionCard>
    )
  return <ServingSizeClient caloriesPerServing={caloriesPerServing} servings={servings} setServings={setServings} />
}

function IngredientsList({
  ingredients,
  servings,
  baseServings,
}: {
  ingredients: { name: string; quantity: number; unit: string; optional?: boolean }[]
  servings: number
  baseServings: number
}) {
  const isClient = useIsClient()
  if (!isClient)
    return (
      <SectionCard title="Ingredients">
        <div className="h-40 animate-pulse rounded-md bg-muted" />
      </SectionCard>
    )
  return <IngredientsClient ingredients={ingredients} servings={servings} baseServings={baseServings} />
}

function Instructions({ cookTimeMinutes, steps }: { cookTimeMinutes: number; steps: string[] }) {
  const isClient = useIsClient()
  if (!isClient)
    return (
      <SectionCard title="Instructions">
        <div className="h-32 animate-pulse rounded-md bg-muted" />
      </SectionCard>
    )
  return <InstructionsClient cookTimeMinutes={cookTimeMinutes} steps={steps} />
}

function ServingSizeClient({
  caloriesPerServing,
  servings,
  setServings,
}: {
  caloriesPerServing: number
  servings: number
  setServings: React.Dispatch<React.SetStateAction<number>>
}) {
  const [mode, setMode] = React.useState<"per" | "total">("per")
  const calories = mode === "per" ? caloriesPerServing : servings * caloriesPerServing

  return (
    <SectionCard title="Serving Size">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-8 w-8 rounded-md border border-input text-lg leading-none"
            onClick={() => setServings((s) => Math.max(1, s - 1))}
            aria-label="Decrease servings"
          >
            {"–"}
          </button>
          <input
            value={servings}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/[^0-9]/g, "")) || 1
              setServings(Math.max(1, n))
            }}
            className="w-16 rounded-md border border-input bg-background px-3 py-2 text-center text-sm"
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label="Servings"
          />
          <button
            type="button"
            className="h-8 w-8 rounded-md border border-input text-lg leading-none"
            onClick={() => setServings((s) => s + 1)}
            aria-label="Increase servings"
          >
            {"+"}
          </button>
        </div>

        <div className="ml-2 flex items-center gap-2">
          <label className="text-sm">{"View:"}</label>
          <div className="inline-flex overflow-hidden rounded-md border border-input">
            <button
              type="button"
              className={cn("px-3 py-1 text-sm", mode === "per" && "bg-accent text-accent-foreground")}
              onClick={() => setMode("per")}
              aria-pressed={mode === "per"}
            >
              {"Per serving"}
            </button>
            <button
              type="button"
              className={cn("px-3 py-1 text-sm", mode === "total" && "bg-accent text-accent-foreground")}
              onClick={() => setMode("total")}
              aria-pressed={mode === "total"}
            >
              {"Total"}
            </button>
          </div>
        </div>

        <div className="ml-auto text-sm">
          <span className="text-muted-foreground">{"Calories: "}</span>
          <span className="font-medium">{calories} kcal</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {"Adjust servings to update total calories. Ingredient quantities are illustrative in this demo."}
      </p>
    </SectionCard>
  )
}

function IngredientsClient({
  ingredients,
  servings,
  baseServings,
}: {
  ingredients: { name: string; quantity: number; unit: string; optional?: boolean }[]
  servings: number
  baseServings: number
}) {
  const [checked, setChecked] = React.useState<Record<string, boolean>>({})
  const ratio = servings / (baseServings || 1)
  const fmt = (n: number) => {
    if (Math.abs(n - Math.round(n)) < 1e-6) return String(Math.round(n))
    return String(parseFloat(n.toFixed(2)))
  }
  return (
    <SectionCard title="Ingredients">
      <ul className="space-y-2">
        {ingredients.map((ing) => {
          const scaled = ing.quantity * ratio
          const label = `${fmt(scaled)} ${ing.unit} ${ing.name}${ing.optional ? " (optional)" : ""}`
          return (
            <li key={ing.name} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!checked[ing.name]}
                onChange={(e) => setChecked((s) => ({ ...s, [ing.name]: e.target.checked }))}
                aria-label={`Mark ${label} as added`}
              />
              <span>{label}</span>
            </li>
          )
        })}
      </ul>
    </SectionCard>
  )
}

function InstructionsClient({ cookTimeMinutes, steps }: { cookTimeMinutes: number; steps?: string[] }) {
   const provided = Array.isArray(steps) && steps.length > 0
   const displaySteps = provided
     ? (steps as string[])
     : [
         "Prepare all ingredients and tools.",
         "Start cooking according to recipe method.",
         `Simmer/cook for about ${cookTimeMinutes} minutes as needed.`,
         "Taste and adjust seasoning.",
         "Plate and serve.",
       ]
   const [active, setActive] = React.useState<number | null>(null)
   const [done, setDone] = React.useState<Record<number, boolean>>({})
 
   return (
     <SectionCard title="Step-by-step Instructions">
       <ol className="space-y-3">
        {displaySteps.map((s, i) => {
           const idx = i + 1
           const isActive = active === idx
           const isDone = !!done[idx]
           return (
             <li
               key={idx}
               className={cn(
                 "flex items-start gap-3 rounded-md border border-border px-3 py-2",
                 isActive && "ring-2 ring-ring/40",
               )}
             >
               <input
                 type="checkbox"
                 className="mt-1"
                 checked={isDone}
                 onChange={(e) => setDone((d) => ({ ...d, [idx]: e.target.checked }))}
                 aria-label={`Mark step ${idx} as done`}
               />
               <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{`Step ${idx}`}</span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                    onClick={() => setActive(isActive ? null : idx)}
                    aria-pressed={isActive}
                  >
                    {isActive ? "Unhighlight" : "Highlight"}
                  </button>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </SectionCard>
  )
}

