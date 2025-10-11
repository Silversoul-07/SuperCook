export type Recipe = {
  _id: string
  title: string
  description: string
  image: string
  cuisine: string
  ingredients: {
    name: string
    quantity: number
    unit: string
    optional?: boolean
    substitutes?: string[]
  }[]
  instructions: string[]
  servings: number
  cookTimeMinutes: number
  prepTimeMinutes?: number
  difficulty: "easy" | "medium" | "hard"
  dietary: Array<
    "vegetarian" | "vegan" | "gluten-free" | "dairy-free" | "nut-free" | "halal" | "kosher"
  >
  nutritionPerServing: {
    calories: number
    protein: number
    fat: number
    carbs: number
  }
  ratings?: {
    avg: number
    count: number
  }
  tags?: string[]
}
