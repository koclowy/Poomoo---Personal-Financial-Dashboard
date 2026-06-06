const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`

const RESPONSE_SCHEMA = `Respond ONLY with a valid JSON object. No explanation. No markdown code blocks. Just raw JSON.

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
}`

function buildFullPrompt(funds, userMessage, currentUser) {
  const fundsContext = funds.map((f) => ({
    name: f.name,
    fundId: f.id,
    columns: f.columns,
    recentData: (f.data || []).slice(-3),
  }))
  return `You are Poomoo, a helpful AI assistant for a personal finance dashboard.
The user manages these savings funds:
${JSON.stringify(fundsContext, null, 2)}

Current user name: "${currentUser.displayName}"
Today's date: "${new Date().toLocaleDateString('en-MY')}"

Your job is to identify which fund and which cell to update.

${RESPONSE_SCHEMA}

User message: "${userMessage}"`
}

function buildShortPrompt(funds, userMessage) {
  const fundNames = funds.map((f) => f.name).join(', ')
  return `Context: You are Poomoo AI. Available funds: ${fundNames}.\n\n${RESPONSE_SCHEMA}\n\nUser message: "${userMessage}"`
}

export async function askGemini(funds, userMessage, currentUser, history = []) {
  let contents

  if (history.length === 0) {
    contents = [{ role: 'user', parts: [{ text: buildFullPrompt(funds, userMessage, currentUser) }] }]
  } else {
    contents = []
    history.forEach((msg, i) => {
      if (msg.role === 'user') {
        const isFirst = i === 0
        contents.push({
          role: 'user',
          parts: [{ text: isFirst ? buildFullPrompt(funds, msg.text, currentUser) : buildShortPrompt(funds, msg.text) }],
        })
      } else {
        contents.push({ role: 'model', parts: [{ text: msg.text }] })
      }
    })
    contents.push({ role: 'user', parts: [{ text: buildShortPrompt(funds, userMessage) }] })
  }

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    })

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      const msg = errBody?.error?.message || `HTTP ${res.status}`
      const errResult = { action: 'chat', reply: `Gemini error: ${msg}` }
      return { result: errResult, rawText: JSON.stringify(errResult) }
    }

    const json = await res.json()
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const clean = rawText.replace(/```json|```/g, '').trim()

    try {
      return { result: JSON.parse(clean), rawText }
    } catch {
      const errResult = { action: 'chat', reply: "I had trouble understanding that. Could you try rephrasing?" }
      return { result: errResult, rawText: JSON.stringify(errResult) }
    }
  } catch (err) {
    const errResult = { action: 'chat', reply: `Error: ${err.message}` }
    return { result: errResult, rawText: JSON.stringify(errResult) }
  }
}
