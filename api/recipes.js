// api/recipes.js
import fs from "fs";
import path from "path";

// Läs in samma recipes.json som på din lokala server
const recipesPath = path.join(process.cwd(), "server", "data", "recipes.json");
const raw = fs.readFileSync(recipesPath, "utf8");
const RAW_RECIPES = JSON.parse(raw);

// Förbered recept
const RECIPES = RAW_RECIPES.map((r, idx) => {
  const ingredientsArray = Array.isArray(r.ingredients) ? r.ingredients : [];
  const ingredientNames = ingredientsArray
    .map((ing) => ing.name?.toLowerCase().trim())
    .filter(Boolean);

  const rawInstr = r.Instructions || r.instructions;
  const instructionsText = Array.isArray(rawInstr)
    ? rawInstr.map((step, i) => `Steg ${i + 1}: ${step}`).join(" ")
    : rawInstr || "";

  return {
    id: r.id ?? idx,
    name: r.title,
    time: r.time,
    tags: r.tags || [],
    ingredientNames,
    instructions: instructionsText,
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

    return {
      id: r.id,
      name: r.name,
      time: r.time,
      tags: r.tags,
      instructions: r.instructions,
      score,
      matched: hits,
      missing,
    };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Endast POST stöds." });
    return;
  }

  const { ingredients = "" } = req.body || {};
  const results = matchRecipes(ingredients);
  res.status(200).json(results);
}
