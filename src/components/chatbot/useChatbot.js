const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`

export async function askGemini(funds, userMessage, currentUser) {
  const fundsContext = funds.map((f) => ({
    name: f.name,
    fundId: f.id,
    columns: f.columns,
    recentData: (f.data || []).slice(-3),
  }))

  const prompt = `
You are Poomoo, a helpful AI assistant for a personal finance dashboard.
The user manages these savings funds:
${JSON.stringify(fundsContext, null, 2)}

Current user name: "${currentUser.displayName}"
Today's date: "${new Date().toLocaleDateString('en-MY')}"

User message: "${userMessage}"

Your job is to identify which fund and which cell to update.

Respond ONLY with a valid JSON object. No explanation. No markdown code blocks. Just raw JSON.

If you can make the edit:
{
  "action": "update_cell",
  "fundId": "<the fund's id from the list above>",
  "fundName": "<human readable fund name>",
  "month": "<exact month value as it appears in the data, e.g. Jan 2025>",
  "column": "<exact column name to update>",
  "value": <numeric value, no currency symbols>,
  "summary": "<one friendly sentence confirming what you will do, in the user's language>"
}

If you need clarification:
{
  "action": "clarify",
  "question": "<specific question to ask the user>"
}

If the request is not about editing a fund:
{
  "action": "chat",
  "reply": "<friendly helpful response>"
}
`

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      const msg = errBody?.error?.message || `HTTP ${res.status}`
      return { action: 'chat', reply: `Gemini error: ${msg}` }
    }

    const json = await res.json()
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const clean = text.replace(/```json|```/g, '').trim()

    return JSON.parse(clean)
  } catch (err) {
    return { action: 'chat', reply: `Error: ${err.message}` }
  }
}
