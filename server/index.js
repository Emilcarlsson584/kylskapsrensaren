require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path"); // <- viktigt

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// === LÄS IN RECEPT FRÅN JSON-FIL ===
let RAW_RECIPES = [];
try {
  const recipesPath = path.join(__dirname, "data", "recipes.json");
  const file = fs.readFileSync(recipesPath, "utf8");
  const parsed = JSON.parse(file);

  // Om filen är { "recipes": [ ... ] } istället för bara [ ... ]
  if (Array.isArray(parsed)) {
    RAW_RECIPES = parsed;
  } else if (Array.isArray(parsed.recipes)) {
    RAW_RECIPES = parsed.recipes;
  } else {
    console.error(
      "recipes.json har oväntat format. Förväntar en array eller { recipes: [...] }"
    );
    RAW_RECIPES = [];
  }

  console.log(`Läste in ${RAW_RECIPES.length} recept från recipes.json`);
} catch (err) {
  console.error("Kunde inte läsa recipes.json:", err);
  RAW_RECIPES = [];
}

// Förbered recept för matchning (bara ingrediensnamn i gemener)
const RECIPES = RAW_RECIPES.map((r, idx) => {
  const ingredientsArray = Array.isArray(r.ingredients) ? r.ingredients : [];

  if (!Array.isArray(r.ingredients)) {
    console.warn(
      `Varning: recept med id=${r.id ?? idx} saknar 'ingredients'-array`
    );
  }

  const ingredientNames = ingredientsArray
    .map((ing) => ing.name?.toLowerCase().trim())
    .filter(Boolean);

  return {
    ...r,
    ingredientNames,
  };
});

function matchRecipes(text) {
  const items = text
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return RECIPES.map((r) => {
    const hits = r.ingredientNames.filter((i) => items.includes(i));
    const score =
      r.ingredientNames.length > 0
        ? hits.length / r.ingredientNames.length
        : 0;

    const missing = r.ingredientNames.filter((i) => !items.includes(i));

    // Gör om Instructions-array → en textsträng
    const instructionsText = Array.isArray(r.Instructions)
      ? r.Instructions.join(" ")
      : r.Instructions || "";

    return {
      id: r.id,
      name: r.title, // <- matchar din RecipeCard
      image: r.image || r.imageUrl || r.imageURL || "",
      time: r.time,
      tags: r.tags || [],
      instructions: instructionsText,
      score,
      matched: hits,
      missing,
    };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

// === VANLIGA RECEPT ===
app.post("/api/recipes", (req, res) => {
  const results = matchRecipes(req.body.ingredients || "");
  res.json(results);
});

// === AI-RECEPT ===
app.post("/api/ai-recipes", async (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients || !ingredients.trim()) {
    return res
      .status(400)
      .json({ error: "Skicka med ingredienser i request-body." });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini", // byt vid behov till modell du har tillgång till
      messages: [
    {
      role: "system",
      content: `
Du är en svensk kock-AI.
Skapa 3 recept på svenska utifrån användarens ingredienser.
Svara i markdown med:
- 🍽︎ Titel
- Tillagningstid (uppskattning)
- Ingredienser (punktlista med mängder)
- Instruktioner (numrerade)
- Tips (substitut)
Beräkna inte matchprocent.`
    },
    {
      role: "user",
      content: `
Ingredienser jag har: ${ingredients}
      `
    }
  ]
});

    const text = response.choices[0]?.message?.content || "";
    res.json({ text });
  } catch (err) {
    console.error("Fel från OpenAI:", err);
    res.status(500).json({ error: "Kunde inte generera AI-recept just nu." });
  }
});

app.listen(3000, () =>
  console.log("Server kör på http://localhost:3000")
);
