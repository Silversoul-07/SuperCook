import React from "react"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { SearchBar } from "@/components/search-bar"
import { FilterSidebar, type RecipeFilters } from "@/components/filters"
import { RecipeCard } from "@/components/recipe-card"
import UploadIngredientsDialog from "@/components/UploadIngredientsDialog"
import {type Recipe} from "@/types"
import { useTheme } from "@/components/theme-provider"
import { Button } from "./components/ui/button"

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
  const res = await fetch(import.meta.env.VITE_API_URL + "/api/recipes/search", {
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

// small consumer component that must live inside ThemeProvider
function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      type="button"
      aria-label="Toggle color theme"
      onClick={toggleTheme}
      className="rounded-md border px-3 py-1 text-sm hover:bg-accent/50"
    >
      {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
    </button>
  )
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

  const [generating, setGenerating] = React.useState(false)

  const payload: SearchPayload = React.useMemo(() => ({ terms, filters }), [terms, filters])

  const { data, error, isLoading, mutate } = useSWR<{ recipes: Recipe[] }, Error>(
    ["recipes-search", payload],
    (key: [string, SearchPayload]) => fetcher(key[0], key[1]),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  )

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await mutate()
    } finally {
      setGenerating(false)
    }
  }

  return (
    <main className="min-h-dvh">
      <header className="border-b border-border bg-card relative">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-pretty text-2xl font-semibold">Generate Recipes</h1>
          <p className="mt-1 text-muted-foreground">Search and filter ingredients just like shopping for products.</p>
          <div className="absolute top-4 right-4">
            <ThemeToggleButton />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1 relative">
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
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <UploadIngredientsDialog
                  onAdd={(name) => {
                    const term = name.toLowerCase()
                    setTerms((prev) => (prev.includes(term) ? prev : [...prev, term]))
                  }}
                >
                </UploadIngredientsDialog>
              </div>
            </div>
            <Button onClick={handleGenerate}>
              {generating ? "Generating..." : "Generate Recipes"}
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <aside className="md:col-span-1">
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-lg font-medium">Filters</h2>
              <p className="mb-4 text-sm text-muted-foreground">Refine your search.</p>
              <FilterSidebar value={filters} onChange={setFilters} />
            </div>
          </aside>

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
              {!isLoading && !error && data?.recipes?.length === 0 && (
                <div className="col-span-full rounded-md border border-border bg-card p-6 text-center">
                  <p className="text-sm text-muted-foreground">No recipes found. Try generating new ones.</p>
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