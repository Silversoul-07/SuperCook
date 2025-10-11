export type Recipe = {
  id: string
  title: string
  description: string
  image: string
  cuisine: string
  ingredients: string[]
  cookTimeMinutes: number
  difficulty: "easy" | "medium" | "hard"
  dietary: Array<"vegetarian" | "vegan" | "gluten-free" | "dairy-free" | "nut-free" | "halal" | "kosher">
  calories: number
}

export const RECIPES: Recipe[] = [
  {
    id: "r1",
    title: "Carrot Ginger Soup",
    description: "A silky smooth soup with fresh carrots, ginger, and a touch of coconut milk.",
    image: "/carrot-ginger-soup-in-a-bowl.jpg",
    cuisine: "American",
    ingredients: ["carrot", "ginger", "onion", "vegetable broth", "coconut milk"],
    cookTimeMinutes: 30,
    difficulty: "easy",
    dietary: ["vegetarian", "vegan", "gluten-free", "dairy-free", "halal", "kosher"],
    calories: 220,
  },
  {
    id: "r2",
    title: "Mediterranean Chickpea Salad",
    description: "Refreshing salad with chickpeas, cucumber, tomatoes, olives, and a lemon-herb dressing.",
    image: "/mediterranean-chickpea-salad.png",
    cuisine: "Mediterranean",
    ingredients: ["chickpeas", "cucumber", "tomato", "olive", "lemon", "parsley"],
    cookTimeMinutes: 15,
    difficulty: "easy",
    dietary: ["vegetarian", "vegan", "gluten-free", "dairy-free", "halal", "kosher", "nut-free"],
    calories: 320,
  },
  {
    id: "r3",
    title: "Chicken Tikka Masala",
    description: "Tender chicken in a creamy spiced tomato sauce, perfect with basmati rice.",
    image: "/chicken-tikka-masala-with-rice.jpg",
    cuisine: "Indian",
    ingredients: ["chicken", "tomato", "yogurt", "garam masala", "ginger", "garlic"],
    cookTimeMinutes: 55,
    difficulty: "medium",
    dietary: ["halal", "kosher", "gluten-free", "nut-free"],
    calories: 540,
  },
  {
    id: "r4",
    title: "Pasta Aglio e Olio",
    description: "Classic Italian pasta with garlic, olive oil, chili flakes, and parsley.",
    image: "/pasta-aglio-e-olio.jpg",
    cuisine: "Italian",
    ingredients: ["spaghetti", "garlic", "olive oil", "chili flakes", "parsley"],
    cookTimeMinutes: 20,
    difficulty: "easy",
    dietary: ["vegetarian", "kosher", "nut-free"],
    calories: 480,
  },
  {
    id: "r5",
    title: "Beef Tacos with Salsa",
    description: "Crispy tacos loaded with seasoned beef, fresh salsa, and shredded lettuce.",
    image: "/beef-tacos-salsa.png",
    cuisine: "Mexican",
    ingredients: ["beef", "tortilla", "tomato", "onion", "lettuce", "cheddar"],
    cookTimeMinutes: 25,
    difficulty: "easy",
    dietary: ["nut-free"],
    calories: 610,
  },
  {
    id: "r6",
    title: "Veggie Stir-Fry",
    description: "Colorful mix of broccoli, bell pepper, carrot, and tofu tossed in a savory sauce.",
    image: "/veggie-stir-fry-with-tofu.jpg",
    cuisine: "Chinese",
    ingredients: ["broccoli", "bell pepper", "carrot", "tofu", "soy sauce", "garlic"],
    cookTimeMinutes: 18,
    difficulty: "easy",
    dietary: ["vegetarian", "vegan", "dairy-free", "kosher"],
    calories: 350,
  },
  {
    id: "r7",
    title: "Spicy Thai Green Curry",
    description: "Fragrant green curry with coconut milk, vegetables, and your choice of protein.",
    image: "/thai-green-curry.png",
    cuisine: "Thai",
    ingredients: ["green curry paste", "coconut milk", "eggplant", "basil", "chicken"],
    cookTimeMinutes: 35,
    difficulty: "medium",
    dietary: ["gluten-free", "halal"],
    calories: 520,
  },
  {
    id: "r8",
    title: "French Ratatouille",
    description: "Provencal vegetable stew featuring eggplant, zucchini, peppers, and tomatoes.",
    image: "/french-ratatouille-in-pan.jpg",
    cuisine: "French",
    ingredients: ["eggplant", "zucchini", "tomato", "bell pepper", "onion", "garlic"],
    cookTimeMinutes: 60,
    difficulty: "hard",
    dietary: ["vegetarian", "vegan", "gluten-free", "dairy-free", "halal", "kosher"],
    calories: 280,
  },
  {
    id: "r9",
    title: "Greek Yogurt Parfait",
    description: "Layered parfait with Greek yogurt, honey, granola, and fresh berries.",
    image: "/greek-yogurt-parfait.png",
    cuisine: "Mediterranean",
    ingredients: ["yogurt", "honey", "granola", "strawberry", "blueberry"],
    cookTimeMinutes: 10,
    difficulty: "easy",
    dietary: ["vegetarian", "kosher", "nut-free"],
    calories: 300,
  },
]
