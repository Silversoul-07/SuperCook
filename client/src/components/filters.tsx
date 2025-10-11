import { cn } from "@/lib/utils"

export type RecipeFilters = {
  time: "any" | "<15" | "15-30" | "30-60" | ">60"
  difficulty: "any" | "easy" | "medium" | "hard"
  dietary: Array<"vegetarian" | "vegan" | "gluten-free" | "dairy-free" | "nut-free" | "halal" | "kosher">
  caloriesMin: string
  caloriesMax: string
  servings: number
  cuisines: string[]
}

const CUISINES = ["Italian", "Indian", "Mexican", "Chinese", "Mediterranean", "American", "Thai", "French"]

export function FilterSidebar({
  value,
  onChange,
}: {
  value: RecipeFilters
  onChange: (v: RecipeFilters) => void
}) {
  const update = <K extends keyof RecipeFilters>(key: K, val: RecipeFilters[K]) => onChange({ ...value, [key]: val })

  const toggleDietary = (d: RecipeFilters["dietary"][number]) => {
    const set = new Set(value.dietary)
    if (set.has(d)) set.delete(d)
    else set.add(d)
    update("dietary", Array.from(set) as RecipeFilters["dietary"])
  }

  const toggleCuisine = (c: string) => {
    const set = new Set(value.cuisines)
    if (set.has(c)) set.delete(c)
    else set.add(c)
    update("cuisines", Array.from(set))
  }

  return (
    <form className="space-y-5" onSubmit={(e) => e.preventDefault()} aria-label="Recipe filters">
      {/* Cooking Time */}
      <fieldset>
        <legend className="mb-2 flex items-center gap-2 text-sm font-medium">
          <span aria-hidden="true">{"⏱️"}</span> {"Cooking Time"}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Any", val: "any" },
            { label: "< 15 min", val: "<15" },
            { label: "15–30 min", val: "15-30" },
            { label: "30–60 min", val: "30-60" },
            { label: "> 60 min", val: ">60" },
          ].map((opt) => (
            <label
              key={opt.val}
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <input
                type="radio"
                name="time"
                value={opt.val}
                checked={value.time === (opt.val as any)}
                onChange={() => update("time", opt.val as any)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Difficulty */}
      <fieldset>
        <legend className="mb-2 flex items-center gap-2 text-sm font-medium">
          <span aria-hidden="true">{"🧑‍🍳"}</span> {"Difficulty"}
        </legend>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Any", val: "any" },
            { label: "Easy", val: "easy" },
            { label: "Medium", val: "medium" },
            { label: "Hard", val: "hard" },
          ].map((opt) => (
            <label
              key={opt.val}
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <input
                type="radio"
                name="difficulty"
                value={opt.val}
                checked={value.difficulty === (opt.val as any)}
                onChange={() => update("difficulty", opt.val as any)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Dietary Preferences */}
      <fieldset>
        <legend className="mb-2 flex items-center gap-2 text-sm font-medium">
          <span aria-hidden="true">{"🥦"}</span> {"Dietary Preferences"}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { k: "vegetarian", label: "Vegetarian 🥦" },
            { k: "vegan", label: "Vegan 🌱" },
            { k: "gluten-free", label: "Gluten-Free 🌾🚫" },
            { k: "dairy-free", label: "Dairy-Free 🥛🚫" },
            { k: "nut-free", label: "Nut-Free 🌰🚫" },
            { k: "halal", label: "Halal ☪️" },
            { k: "kosher", label: "Kosher ✡️" },
          ].map((d) => (
            <label
              key={d.k}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm",
                value.dietary.includes(d.k as any) && "ring-2 ring-ring/40",
              )}
            >
              <input
                type="checkbox"
                checked={value.dietary.includes(d.k as any)}
                onChange={() => toggleDietary(d.k as any)}
              />
              <span>{d.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Calories */}
      <fieldset>
        <legend className="mb-2 flex items-center gap-2 text-sm font-medium">
          <span aria-hidden="true">{"🔥"}</span> {"Calories per Serving"}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="cal-min" className="text-xs text-muted-foreground">
              {"Min"}
            </label>
            <input
              id="cal-min"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="100"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={value.caloriesMin}
              onChange={(e) => update("caloriesMin", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="cal-max" className="text-xs text-muted-foreground">
              {"Max"}
            </label>
            <input
              id="cal-max"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="800"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={value.caloriesMax}
              onChange={(e) => update("caloriesMax", e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      {/* Servings */}
      <fieldset>
        <legend className="mb-2 flex items-center gap-2 text-sm font-medium">
          <span aria-hidden="true">{"🍽️"}</span> {"Serving Size"}
        </legend>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-8 w-8 rounded-md border border-input text-lg leading-none"
            onClick={() => update("servings", Math.max(1, value.servings - 1))}
            aria-label="Decrease servings"
          >
            {"–"}
          </button>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label="Servings"
            value={value.servings}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/[^0-9]/g, "")) || 1
              update("servings", Math.max(1, n))
            }}
            className="w-16 rounded-md border border-input bg-background px-3 py-2 text-center text-sm"
          />
          <button
            type="button"
            className="h-8 w-8 rounded-md border border-input text-lg leading-none"
            onClick={() => update("servings", value.servings + 1)}
            aria-label="Increase servings"
          >
            {"+"}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {"Used for reference; ingredients not shown here adjust visually."}
        </p>
      </fieldset>

      {/* Cuisine */}
      <fieldset>
        <legend className="mb-2 flex items-center gap-2 text-sm font-medium">
          <span aria-hidden="true">{"🌍"}</span> {"Cuisine Type"}
        </legend>
        <div className="flex flex-wrap gap-2">
          {CUISINES.map((c) => {
            const active = value.cuisines.includes(c)
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCuisine(c)}
                className={cn(
                  "rounded-full border border-input bg-background px-3 py-1 text-sm",
                  active && "bg-accent text-accent-foreground",
                )}
                aria-pressed={active}
              >
                {c}
              </button>
            )
          })}
        </div>
      </fieldset>
    </form>
  )
}
