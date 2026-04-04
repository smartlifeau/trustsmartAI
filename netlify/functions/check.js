exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  const { content, mode, imageData, imageMime } = body;

  const system = `You are TrustSmart AI, an Australian content verification assistant. Respond ONLY with raw JSON — no markdown, no backticks, no explanation text outside the JSON.

Return this exact structure:
{
  "overallScore": <integer 0-100, 100=fully genuine>,
  "verdict": <string>,
  "verdictType": <"genuine"|"uncertain"|"false">,
  "subScores": {
    "factualAccuracy": <0-100>,
    "sourceBacking": <0-100>,
    "humanAuthored": <0-100>,
    "contextAccuracy": <0-100>
  },
  "summary": "<2-3 sentence plain English assessment>",
  "claims": [{"text":"<claim>","status":"<confirmed|false|uncertain>","detail":"<brief reason>"}],
  "sources": [{"name":"<n>","url":"<url or #>","organisation":"<org>","reason":"<one sentence>","date":"<date if known>","relation":"<confirms|contradicts|partial>"}]
}

Rules:
- Prioritise Australian sources: ABC News, ABS, ACCC, AAP FactCheck, RMIT FactLab, RBA, .gov.au, SBS
- Screenshots/images: read visible text first, then fact-check it
- URLs: check domain legitimacy (fake AU news domains score very low), then assess claims
- 2-5 claims, 2-4 sources
- verdictType: "genuine" if overallScore>=65, "uncertain" if 35-64, "false" if <35`;

  let userMsg;
  if (imageData && imageMime) {
    userMsg = [
      { type: "image", source: { type: "base64", media_type: imageMime, data: imageData } },
      {
        type: "text",
        text: mode === "screenshot"
          ? "This is a screenshot. Read all visible text, extract the claims, and fact-check them against Australian sources."
          : "Analyse this image: Is it AI-generated? What claims or text does it contain? Fact-check against Australian sources."
      }
    ];
  } else if (mode === "url") {
    userMsg = `Assess this URL for genuineness: ${content}\n\nCheck domain credibility (does it mimic a real Australian outlet?), likely content type, and rate trustworthiness.`;
  } else {
    userMsg = `Fact-check and assess the genuineness of this content against Australian sources:\n\n"${content}"`;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system,
        messages: [{ role: "user", content: userMsg }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: err.error?.message || `API error ${response.status}` })
      };
    }

    const data = await response.json();
    const raw = data.content.map(b => b.text || "").join("").replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error("Could not parse response");
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Internal server error" })
    };
  }
};
