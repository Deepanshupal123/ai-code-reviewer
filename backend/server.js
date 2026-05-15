require('dotenv').config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PROMPT_TEMPLATE = (language, code) => `You are an expert code reviewer. Review this ${language || "code"} and respond in this exact JSON format only. No markdown, no backticks, no extra text — just raw JSON:
{
  "summary": "One sentence overall assessment",
  "score": 7,
  "issues": [
    {
      "severity": "critical",
      "line": "1",
      "title": "Short issue title",
      "description": "Detailed explanation of the issue",
      "fix": "How to fix it with example"
    }
  ],
  "positives": ["What the code does well"],
  "refactoredSnippet": "Improved version of most critical part or null"
}

Code to review:
\`\`\`${language || ""}
${code}
\`\`\``;

app.post("/api/review", async (req, res) => {
  const { code, language } = req.body;

  if (!code || code.trim().length === 0) {
    return res.status(400).json({ error: "No code provided" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: PROMPT_TEMPLATE(language, code),
          },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    const data = await response.json();
    console.log("Groq status:", response.status);

    if (data.error) {
      console.error("Groq error:", data.error);
      return res.status(500).json({ error: "Groq API error: " + data.error.message });
    }

    const raw = data.choices[0].message.content;
    console.log("Raw preview:", raw.substring(0, 200));

    const cleaned = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found:", raw);
      return res.status(500).json({ error: "Could not parse AI response" });
    }

    const review = JSON.parse(jsonMatch[0]);
    res.json(review);

  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: "Review failed: " + err.message });
  }
});

app.get("/health", (_, res) => res.json({ status: "ok", groq: !!process.env.GROQ_API_KEY }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
