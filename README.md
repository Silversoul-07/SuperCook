# Documentation

## Overview

Smart Recipe Generator suggests recipes from a MongoDB-backed recipe store and — when no match exists — generates new recipe ideas using an LLM. It accepts ingredients via text or image (Robolow), fetches illustrative images from Unsplash (optional), and serves a React frontend with an Express API. Frontend and backend are deployed on Vercel.

Key integrations:

* **Robolow** — ingredient recognition from photos
* **Gemini** — LLM for on-demand recipe generation (`/api/generate-recipes`)
* **Unsplash API** — optional images for generated recipes
* **MongoDB** — recipe storage (Atlas)
* **MERN stack** — React front, Express/Node back, Mongoose for models


# Architecture (high level)

* **Frontend (React)** — search, filters, show results, recipe page, image upload; deployed to Vercel.
* **Backend (Express)** — REST API, matching logic, LLM orchestration, image recognition proxy, seeded recipes in MongoDB; deployed to Vercel.
* **External services** — Robolow for CV, Gemini for text generation, Unsplash for images, MongoDB Atlas for data.

#### Flow:

1. User provides ingredients (text or image).
2. Frontend sends `GET /api/recipes?ingredients=[...]`.
3. Backend queries MongoDB, computes scores, returns matches.
4. If 0 results, frontend calls `POST /api/generate-recipes` → backend calls Gemini to produce recipes, formats them, optionally persists to MongoDB, returns to frontend.
5. For uploaded images, frontend uploads post to Roboflow → Roboflow returns canonical ingredient list for user confirmation.


# API Endpoints

## GET /api/recipes

Query recipes from DB with filters.

* Query params: `ingredients[]`, `diet[]`, `timeMax`, `difficulty`, `limit`
* Response: `[{recipe...}]` (sorted by match score)

## POST /api/generate-recipes

Generate recipes using LLM when DB has none/sparse matches.

* Body: `{ ingredients: string[], dietary: string[], timeMax?: number, count?: number }`
* Behavior: calls Gemini, validates + normalizes output, optionally saves to DB.
* Response: `[{recipe...}]` (generated)

## GET /api/recipes/:id

Fetch full recipe by id.


# Data model (essential fields)

Minimal recipe shape used across the app:

```ts
type Recipe = {
  id: string
  title: string
  description?: string
  images?: string[]
  cuisine?: string
  ingredients: IngredientLine[]
  instructions: string[]
  baseServings: number
  cookTimeMinutes?: number
  prepTimeMinutes?: number
  difficulty: "easy"|"medium"|"hard"
  dietary?: string[]
  nutrition_per_serving?: { calories:number, protein_g:number, fat_g:number, carbs_g:number }
  ratings?: { avg:number, count:number }
  source?: string   // "generated" or "seed" or external url
}
```


# Recipe matching & generation logic (brief)

* **Matching**: backend fetches candidate recipes (e.g., `ingredient_ids: { $in: userIngredients }`), scores them by required / optional match ratios, substitution availability, dietary conflicts, and time/difficulty preferences. Returns top N with a breakdown (`matched_required`, `missing_required`, `score`).
* **Fallback generation**: when no DB recipe meets threshold or DB returns `[]`, the frontend calls `/api/generate-recipes`. Backend composes a Gemini prompt with:

  * user ingredients, dietary constraints, desired max time, and desired serving count.
  * Instructs output format (JSON with fields matching your `Recipe` shape).
* **Normalization**: parse Gemini output, validate fields (ingredients as array with quantities/units if present), map ingredient names to canonical IDs/aliases, and either return result directly or save to MongoDB (flag `source: "generated"`).


# Servings & Nutrition scaling (simple rule)

* Store `baseServings` for each recipe and nutrition per serving or per 100g per ingredient.
* Scale factor = `newServings / baseServings`.
* Multiply ingredient quantities and total nutrition by scale factor. Recompute per-serving if needed.
* For discrete items (eggs), apply rounding rules and show UX hints.


# Deployment

* Backend and frontend both deployed to Vercel . Backend runs as serverless functions (be mindful of execution time/size).
* Use environment variables in Vercel dashboard:

  * `MONGODB_URI`, `ROBOFLOW_API_KEY`, `GEMINI_API_KEY`, `UNSPLASH_ACCESS_KEY`, `CORS_ORIGIN`, `NODE_ENV`
* If image recognition or LLM calls are heavy/long-running, consider moving backend to Render/Railway to avoid serverless time limits.

