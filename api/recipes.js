const fs = require("fs");
const path = require("path");

// Läs in samma recipes.json som din nuvarande server
const recipesPath = path.join(process.cwd(), "server", "data", "recipes.json");
const raw = fs.readFileSync(recipesPath, "utf8");
const RECIPES = JSON.parse(raw);

// Samma typ av matchning som du använder i din Express-server
function matchRecipes(text) {
  const items = text
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return RECIPES.map((r) => {
    const recipeIngredients = (r.ingredients || [])
      .map((ing) => ing.name?.toLowerCase().trim())
      .filter(Boolean);

    const matched = recipeIngredients.filter((i) => items.includes(i));
    const score =
      recipeIngredients.length > 0
        ? matched.length / recipeIngredients.length
        : 0;

    const rawInstr = r.Instructions || r.instructions;
    const instructionsText = Array.isArray(rawInstr)
      ? rawInstr.map((step, idx) => `Steg ${idx + 1}: ${step}`).join(" ")
      : rawInstr || "";

    return {
      id: r.id,
      name: r.title,
      time: r.time,
      tags: r.tags || [],
      score,
      matched,
      missing: recipeIngredients.filter((i) => !items.includes(i)),
      instructions: instructionsText,
    };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

// Vercel serverless function
module.exports = (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Endast POST stöds." });
    return;
  }

  const { ingredients = "" } = req.body || {};
  const results = matchRecipes(ingredients);
  res.status(200).json(results);
};
