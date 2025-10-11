import { type Recipe } from "@/types"

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  // normalize id (support _id or legacy id)
  const id = (recipe as any)._id ?? (recipe as any).id
  const calories = recipe.nutritionPerServing?.calories ?? (recipe as any).calories ?? "—"
  const difficultyLabel = recipe.difficulty[0].toUpperCase() + recipe.difficulty.slice(1)

  return (
    <article className="relative overflow-hidden rounded-lg border border-border bg-card hover:shadow-sm transition-shadow">
      <div className="relative h-40 w-full">
        <img
          src={recipe.image || "/placeholder.svg"}
          alt={recipe.title}
          className="object-cover w-full h-full"
          loading="lazy"
        />
      </div>
      <a
        href={`/recipes/${id}`}
        aria-label={`Open recipe: ${recipe.title}`}
        className="absolute inset-0 z-10"
      ></a>

      <div className="p-4">
        <h3 className="text-pretty text-base font-semibold">{recipe.title}</h3>
        <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
          {recipe.description}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>{`${recipe.cookTimeMinutes} min`}</span>
          <span>{difficultyLabel}</span>
          <span>{typeof calories === "number" ? `${calories} kcal` : `${calories}`}</span>
          <span>{recipe.cuisine}</span>
        </div>
      </div>
    </article>
  )
}
