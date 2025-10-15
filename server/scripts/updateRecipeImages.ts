import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";
import axios from "axios";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://praveen:a@cluster0.hukruti.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = process.env.DB_NAME || "recipeDb";
const COLLECTION_NAME = process.env.COLLECTION_NAME || "recipes";
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

if (!UNSPLASH_ACCESS_KEY) {
  console.error("Missing Unsplash API access key. Please set UNSPLASH_ACCESS_KEY in your .env file.");
  process.exit(1);
}

async function getFoodImage(query: string): Promise<string> {
  const url = "https://api.unsplash.com/photos/random";
  const params = {
    query,
    count: 1,
    orientation: "squarish",
  };
  const headers = {
    Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
  };

  try {
    const response = await axios.get(url, { headers, params });
    const data = response.data;
    if (Array.isArray(data) && data.length > 0) {
      return data[0].urls.regular;
    } else if (data.urls) {
      return data.urls.regular;
    }
  } catch (err) {
    console.error("Failed to fetch image from Unsplash:", err.message);
  }

  return "/placeholder.svg"; // Fallback image if API call fails
}

async function updateRecipeImages() {
  const client = new MongoClient(MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const recipesCollection = db.collection(COLLECTION_NAME);

    console.log("Fetching recipes with placeholder images...");
    const recipes = await recipesCollection.find({ image: /example\.com/ }).toArray();

    if (recipes.length === 0) {
      console.log("No recipes with placeholder images found.");
      return;
    }

    console.log(`Found ${recipes.length} recipes with placeholder images. Updating...`);

    for (const recipe of recipes) {
      const newImage = await getFoodImage(recipe.title || "food");
      if (newImage) {
        await recipesCollection.updateOne(
          { _id: recipe._id },
          { $set: { image: newImage } }
        );
        console.log(`Updated recipe "${recipe.title}" with new image.`);
      }
    }

    console.log("Image update process completed.");
  } catch (err) {
    console.error("Error updating recipe images:", err);
  } finally {
    await client.close();
  }
}

updateRecipeImages();
