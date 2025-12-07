// api/ai-recipes.js

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Endast POST stöds." });
    return;
  }

  const { ingredients } = req.body || {};
  if (!ingredients || !ingredients.trim()) {
    return res
      .status(400)
      .json({ error: "Skicka med ingredienser i request-body." });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini", // samma som din lokala server
      messages: [
        {
          role: "system",
          content: `
Du är en svensk kock som hjälper användare att laga mat med det de har hemma.
Svara kort och tydligt på svenska.`,
        },
        {
          role: "user",
          content: `Jag har följande ingredienser hemma: ${ingredients}.
Ge mig 3 olika receptförslag. För varje recept:
- En rubrik (namnet på rätten)
- Kort ingredienslista
- Kortfattade steg-för-steg-instruktioner.

Håll svaret lättläst och använd gärna punktlistor.`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content || "";
    res.status(200).json({ text });
  } catch (err) {
    console.error("Fel från OpenAI:", err);
    res.status(500).json({ error: "Kunde inte generera AI-recept just nu." });
  }
}
