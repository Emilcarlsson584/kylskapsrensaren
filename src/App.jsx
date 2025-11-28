import { useState } from "react";
import "./index.css";

const DUMMY_RECIPES = [
  {
    id: 1,
    name: "Krämig pastapanna med ost",
    ingredients: ["pasta", "ost", "mjölk", "lök", "smör"],
    time: 25,
    instructions: "Koka pasta, gör ostsås, blanda allt i stekpanna.",
    tags: ["snabbt", "vegetariskt"],
  },
  {
    id: 2,
    name: "Omelett med ost och lök",
    ingredients: ["ägg", "ost", "lök", "smör"],
    time: 10,
    instructions: "Vispa ägg, fräs lök, häll över, toppa med ost.",
    tags: ["snabbt", "låg-disk"],
  },
  {
    id: 3,
    name: "Ugnsrostade grönsaker",
    ingredients: ["potatis", "morot", "lök", "olja", "salt"],
    time: 40,
    instructions:
      "Skär grönsaker, ringla över olja och kryddor, rosta i ugn tills mjuka.",
    tags: ["vego", "billigt"],
  },
];

function matchRecipes(userIngredientsRaw, recipes) {
  const set = new Set(
    userIngredientsRaw
      .split(",")
      .map((i) => i.trim().toLowerCase())
      .filter(Boolean)
  );

  if (set.size === 0) return [];

  return recipes
    .map((recipe) => {
      const recipeIngredients = recipe.ingredients.map((i) => i.toLowerCase());
      const hits = recipeIngredients.filter((i) => set.has(i));
      const score = hits.length / recipeIngredients.length;

      return {
        ...recipe,
        score,
        matched: hits,
        missing: recipeIngredients.filter((i) => !set.has(i)),
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

function RecipeCard({ recipe }) {
  const percentage = Math.round(recipe.score * 100);

  return (
    <div className="recipe-card">
      <div className="recipe-card-header">
        <h3>{recipe.name}</h3>
        <span className="badge">{percentage}% match</span>
      </div>
      <div className="meta">
        <span>⏱️ ca {recipe.time} min</span>
        {recipe.tags?.map((tag) => (
          <span key={tag} className="tag">
            #{tag}
          </span>
        ))}
      </div>

      <div className="columns">
        <div>
          <div className="small-title">Du har:</div>
          {recipe.matched.length > 0 ? (
            <ul>
              {recipe.matched.map((ing) => (
                <li key={ing}>{ing}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">Inga träffar</p>
          )}
        </div>
        <div>
          <div className="small-title">Du saknar:</div>
          {recipe.missing.length > 0 ? (
            <ul>
              {recipe.missing.map((ing) => (
                <li key={ing}>{ing}</li>
              ))}
            </ul>
          ) : (
            <p className="success">Du har allt du behöver 🎉</p>
          )}
        </div>
      </div>

      <details className="instructions">
        <summary>Så här gör du</summary>
        <p>{recipe.instructions}</p>
      </details>
    </div>
  );
}

const quickTags = [
  "ägg",
  "mjölk",
  "ost",
  "pasta",
  "lök",
  "potatis",
  "morot",
  "smör",
  "olja",
];

function App() {
  const [ingredientsText, setIngredientsText] = useState("");
  const [results, setResults] = useState([]);
  const [showOnlyFullMatches, setShowOnlyFullMatches] = useState(false);

  const handleSearch = () => {
    const baseResults = matchRecipes(ingredientsText, DUMMY_RECIPES);
    const filtered = showOnlyFullMatches
      ? baseResults.filter((r) => r.score === 1)
      : baseResults;
    setResults(filtered);
  };

  const handleAddQuickIngredient = (ingredient) => {
    if (!ingredientsText.toLowerCase().includes(ingredient.toLowerCase())) {
      const separator = ingredientsText.trim() ? ", " : "";
      setIngredientsText((prev) => prev + separator + ingredient);
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="logo">K</div>
          <div>
            <div className="brand-title">kylskåpsrensaren.se</div>
            <div className="brand-subtitle">Rensa kylen, inte planeten.</div>
          </div>
        </div>
        <div className="topbar-right">
          <span>🌱 Minska matsvinn</span>
          <span>🍳 Få recept-idéer</span>
        </div>
      </header>

      <main className="main">
        <section className="card">
          <h1>Vad har du hemma?</h1>
          <p className="subtitle">
            Skriv in ingredienserna du har i kyl, frys och skafferi, separerade
            med kommatecken. Vi matchar dem mot receptförslag.
          </p>

          <label className="label" htmlFor="ingredients">
            Ingredienser
          </label>
          <textarea
            id="ingredients"
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            placeholder="Ex: ägg, mjölk, ost, lök, pasta"
          />

          <div className="tags-row">
            {quickTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="tag-btn"
                onClick={() => handleAddQuickIngredient(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="controls">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showOnlyFullMatches}
                onChange={(e) => setShowOnlyFullMatches(e.target.checked)}
              />
              Visa bara recept där jag har alla ingredienser
            </label>

            <button type="button" className="primary-btn" onClick={handleSearch}>
              🔍 Hitta recept
            </button>
          </div>
        </section>

        <section className="results">
          <div className="results-header">
            <h2>Dina receptförslag</h2>
            <p className="results-info">
              {results.length > 0
                ? `${results.length} recept hittade`
                : "Ingen sökning gjord ännu"}
            </p>
          </div>

          {results.length === 0 ? (
            <div className="empty-state">
              Skriv in några ingredienser och klicka på{" "}
              <strong>Hitta recept</strong>, så dyker dina
              kylskåpsrensar-idéer upp här.
            </div>
          ) : (
            <div className="results-list">
              {results.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </section>

        <section className="footer-info">
          <h3>På gång</h3>
          <p>
            Den här versionen använder en enkel lokal receptlista. Nästa steg är
            att koppla på en riktig backend och AI som kan skapa receptförslag
            utifrån just dina ingredienser, kostpreferenser och hur mycket tid
            du har.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;
