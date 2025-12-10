import { useState } from "react";
import "./index.css";

const API_BASE = import.meta.env.DEV ? "http://localhost:3000" : "";

function buildNamesOnlyString(ingredients) {
  return ingredients
    .filter((ing) => ing.name && ing.name.trim() !== "")
    .map((ing) => ing.name.trim())
    .join(", ");
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

const quickTags = ["ägg", "mjölk", "ost", "pasta", "lök", "potatis", "morot"];




function App() {
  const [ingredients, setIngredients] = useState([
  { name: "" },
]);

  const [results, setResults] = useState([]);
  const [showOnlyFullMatches, setShowOnlyFullMatches] = useState(false);
  const [aiText, setAiText] = useState("");
const [aiLoading, setAiLoading] = useState(false);

const handleAddQuickIngredient = (name) => {
  setIngredients((prev) => {
    if (prev.some((ing) => ing.name.toLowerCase() === name.toLowerCase())) {
      return prev;
    }
    return [...prev, { name, amount: "", unit: "" }];
  });
};



const handleSearch = async () => {
  try {
    // bygg en enkel kommatext med bara namnen: "mjölk, ägg, pasta"
    const namesOnly = buildNamesOnlyString(ingredients);

    const response = await fetch(`${API_BASE}/api/recipes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ingredients: namesOnly }),
    });

    const data = await response.json();

    const filtered = showOnlyFullMatches
      ? data.filter((r) => r.score === 1)
      : data;

    setResults(filtered);
  } catch (error) {
    console.error("Fel vid hämtning av recept:", error);
    alert("Kunde inte hämta recept från servern.");
  }
};

const handleAiSearch = async () => {
  try {
    setAiLoading(true);
    setAiText("");

    // bygg en text med mängd + enhet: "2 dl mjölk, 3 st ägg"
    const namesOnly = buildNamesOnlyString(ingredients);

    const response = await fetch(`${API_BASE}/api/ai-recipes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ingredients: namesOnly }),
    });

    const data = await response.json();

    if (data.error) {
      alert(data.error);
    } else {
      setAiText(data.text);
    }
  } catch (error) {
    console.error("Fel vid AI-sökning:", error);
    alert("Kunde inte hämta AI-recept just nu.");
  } finally {
    setAiLoading(false);
  }
};




  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="logo">K</div>
          <div>
            <div className="brand-title">Smartkök.com</div>
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
            Skriv in ingredienserna du har i kyl, frys och skafferi. Vi matchar dem mot receptförslag.
          </p>

<label className="label">
  Ingredienser (namn, mängd, enhet)
</label>

{/* INGREDIENS-LISTA MED MÄNGDER */}
<div className="ingredient-list">
  {ingredients.map((ing, index) => (
    <div key={index} className="ingredient-row">
      <input
        type="text"
        placeholder="t.ex. mjöl"
        value={ing.name}
        onChange={(e) => {
          const updated = [...ingredients];
          updated[index].name = e.target.value;
          setIngredients(updated);
        }}
      />

      {/* Ta-bort-knapp för ingrediensrad */}
      <button
        type="button"
        className="ingredient-remove"
        onClick={() => {
          const filtered = ingredients.filter((_, i) => i !== index);
          setIngredients(filtered.length ? filtered : [{ name: "" }]);
        }}
      >
        ✕
      </button>
    </div>
  ))}

  {/* Lägg till ny ingrediens-rad */}
  <button
    type="button"
    className="add-ingredient-btn"
    onClick={() =>
      setIngredients((prev) => [...prev, { name: "" }])
    }
  >
    + Lägg till ingrediens
  </button>
</div>


{/* 🔥 SNABBKNAPPAR — NU PÅ RÄTT PLATS 🔥 */}
<div className="tags-row" style={{ margin: "1rem 0" }}>
  {quickTags.map(tag => (
    <button
      key={tag}
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

  <div style={{ display: "flex", gap: "0.5rem" }}>
    <button type="button" className="primary-btn" onClick={handleSearch}>
      🔍 Vanliga recept
    </button>
    <button
      type="button"
      className="primary-btn"
      onClick={handleAiSearch}
      disabled={aiLoading}
      style={{ backgroundColor: "#6366f1" }}
    >
      {aiLoading ? "🤖 Tänker..." : "🤖 AI-recept"}
    </button>
  </div>
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

        <section className="results" style={{ marginTop: "1.5rem" }}>
  <div className="results-header">
    <h2>AI-genererade recept</h2>
    <p className="results-info">
      {aiText
        ? "Förslag från AI baserat på dina ingredienser"
        : "Inga AI-förslag ännu"}
    </p>
  </div>

  {aiText ? (
    <div
      style={{
        marginTop: "0.75rem",
        whiteSpace: "pre-wrap",
        background: "#f3f4ff",
        borderRadius: "14px",
        padding: "0.9rem",
        fontSize: "0.9rem",
      }}
    >
      {aiText}
    </div>
  ) : (
    <div className="empty-state">
      Klicka på <strong>AI-recept</strong> så föreslår AI tre rätter utifrån
      dina ingredienser.
    </div>
  )}
</section>


        <section className="footer-info">
          <h3>På gång</h3>
          <p>
            Den här versionen använder en enkel lokal receptlista. Den utvecklas hela tiden och denna hemsidan blir således bättre och bättre.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;
