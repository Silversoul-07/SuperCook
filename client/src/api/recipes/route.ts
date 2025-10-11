import { NextResponse } from "next/server"
import { RECIPES } from "@/lib/recipes-data"

function matchesTerms(texts: string[], terms: string[]) {
  if (terms.length === 0) return true
  const hay = texts.join(" ").toLowerCase()
  // AND all terms
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
  // require all selected dietary tags to be present
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

export async function POST(request: Request) {
  const body = await request.json()
  const terms: string[] = Array.isArray(body?.terms) ? body.terms : []
  const filters = body?.filters ?? {}

  const results = RECIPES.filter((r) => {
    const termOk = matchesTerms([r.title, r.description, r.ingredients.join(" ")], terms)
    const timeOk = matchesTime(r.cookTimeMinutes, filters.time ?? "any")
    const diffOk = matchesDifficulty(r.difficulty, filters.difficulty ?? "any")
    const dietOk = matchesDietary(r.dietary, Array.isArray(filters.dietary) ? filters.dietary : [])
    const calOk = matchesCalories(r.calories, filters.caloriesMin, filters.caloriesMax)
    const cuiOk = matchesCuisine(r.cuisine, Array.isArray(filters.cuisines) ? filters.cuisines : [])
    return termOk && timeOk && diffOk && dietOk && calOk && cuiOk
  })

  return NextResponse.json({ recipes: results })
}
