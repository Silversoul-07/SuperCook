import React from "react"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { SearchBar } from "@/components/search-bar"
import { FilterSidebar, type RecipeFilters } from "@/components/filters"
import { RecipeCard } from "@/components/recipe-card"

type SearchPayload = {
  terms: string[]
  filters: RecipeFilters
}

const fetcher = async (key: string, payload: SearchPayload) => {
  const res = await fetch("/api/recipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    throw new Error("Failed to fetch recipes")
  }
  return res.json()
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

  const payload: SearchPayload = React.useMemo(() => ({ terms, filters }), [terms, filters])

  const { data, error, isLoading } = useSWR(["recipes-search", payload], ([key, p]) => fetcher(key, p), {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })

  return (
    <main className="min-h-dvh">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-pretty text-2xl font-semibold">Discover Recipes</h1>
          <p className="mt-1 text-muted-foreground">Search and filter recipes just like shopping for products.</p>
          <div className="mt-4">
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
              {!isLoading && !error && data?.recipes?.length === 0 && (
                <div className="col-span-full rounded-md border border-border bg-card p-6 text-center">
                  <p className="text-sm text-muted-foreground">{"No recipes match your filters."}</p>
                </div>
              )}

              {data?.recipes?.map((r: any) => (
                <RecipeCard key={r.id} recipe={r} />
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
