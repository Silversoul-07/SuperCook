import React from "react"
import { cn } from "@/lib/utils"

export function SearchBar({
  terms,
  onAddTerm,
  onRemoveTerm,
  onClearAll,
}: {
  terms: string[]
  onAddTerm: (term: string) => void
  onRemoveTerm: (term: string) => void
  onClearAll: () => void
}) {
  const [value, setValue] = React.useState("")

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (value.trim()) {
        onAddTerm(value)
        setValue("")
      }
    }
  }

  return (
    <div>
      <label htmlFor="recipe-search" className="sr-only">
        {"Search recipes"}
      </label>
      <div className="flex items-center gap-2">
        <input
          id="recipe-search"
          placeholder="Search recipes (e.g., carrot, pasta, curry)"
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          )}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Recipe search"
        />
        <button
          type="button"
          onClick={() => {
            if (value.trim()) {
              onAddTerm(value)
              setValue("")
            }
          }}
          className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          aria-label="Add search term"
          title="Add"
        >
          {"Add"}
        </button>
      </div>

      {terms.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {terms.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
            >
              {t}
              <button
                type="button"
                onClick={() => onRemoveTerm(t)}
                className="rounded-full border border-transparent bg-transparent px-1 text-xs text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${t}`}
                title="Remove"
              >
                {"✕"}
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onClearAll}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {"Clear all"}
          </button>
        </div>
      )}
    </div>
  )
}
