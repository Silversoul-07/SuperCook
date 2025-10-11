// src/pages/RecipePage.tsx
import React from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { RECIPES } from "../lib/recipes-data"
import { cn } from "../lib/utils"

export default function RecipePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const recipe = RECIPES.find((r) => r.id === id)

  if (!recipe) {
    // Replace `notFound()` with navigation
    React.useEffect(() => {
      navigate("/404", { replace: true })
    }, [navigate])
    return null
  }

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
                {recipe?.dietary?.slice(0, 4).map((d) => (
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
            <span className="font-medium">{recipe.calories} kcal</span>
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 md:col-span-2">
            <ServingSize caloriesPerServing={recipe.calories} />
            <IngredientsList ingredients={recipe.ingredients} />
            <Instructions cookTimeMinutes={recipe.cookTimeMinutes} />
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <NutritionCard caloriesPerServing={recipe.calories} />
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

function NutritionCard({ caloriesPerServing }: { caloriesPerServing: number }) {
  return (
    <SectionCard title="Nutritional Information">
      <table className="w-full text-sm">
        <tbody>
          <tr className="border-b border-border/70">
            <td className="py-2 text-muted-foreground">{"Calories (per serving)"}</td>
            <td className="py-2 text-right font-medium">{caloriesPerServing} kcal</td>
          </tr>
          <tr className="border-b border-border/70">
            <td className="py-2 text-muted-foreground">{"Protein"}</td>
            <td className="py-2 text-right font-medium">{"—"}</td>
          </tr>
          <tr className="border-b border-border/70">
            <td className="py-2 text-muted-foreground">{"Carbohydrates"}</td>
            <td className="py-2 text-right font-medium">{"—"}</td>
          </tr>
          <tr>
            <td className="py-2 text-muted-foreground">{"Fat"}</td>
            <td className="py-2 text-right font-medium">{"—"}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">{"Macros are illustrative; add real values when available."}</p>
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

function ServingSize({ caloriesPerServing }: { caloriesPerServing: number }) {
  const isClient = useIsClient()
  if (!isClient)
    return (
      <SectionCard title="Serving Size">
        <div className="h-16 animate-pulse rounded-md bg-muted" />
      </SectionCard>
    )
  return <ServingSizeClient caloriesPerServing={caloriesPerServing} />
}

function IngredientsList({ ingredients }: { ingredients: string[] }) {
  const isClient = useIsClient()
  if (!isClient)
    return (
      <SectionCard title="Ingredients">
        <div className="h-40 animate-pulse rounded-md bg-muted" />
      </SectionCard>
    )
  return <IngredientsClient ingredients={ingredients} />
}

function Instructions({ cookTimeMinutes }: { cookTimeMinutes: number }) {
  const isClient = useIsClient()
  if (!isClient)
    return (
      <SectionCard title="Instructions">
        <div className="h-32 animate-pulse rounded-md bg-muted" />
      </SectionCard>
    )
  return <InstructionsClient cookTimeMinutes={cookTimeMinutes} />
}

function ServingSizeClient({ caloriesPerServing }: { caloriesPerServing: number }) {
  const [servings, setServings] = React.useState(1)
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

function IngredientsClient({ ingredients }: { ingredients: string[] }) {
  const [checked, setChecked] = React.useState<Record<string, boolean>>({})
  return (
    <SectionCard title="Ingredients">
      <ul className="space-y-2">
        {ingredients.map((ing) => (
          <li key={ing} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!checked[ing]}
              onChange={(e) => setChecked((s) => ({ ...s, [ing]: e.target.checked }))}
              aria-label={`Mark ${ing} as added`}
            />
            <span>{ing}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}

function InstructionsClient({ cookTimeMinutes }: { cookTimeMinutes: number }) {
  const steps = [
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
        {steps.map((s, i) => {
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
