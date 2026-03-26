const fetch = require('node-fetch');

const generateMOMFromText = async (extractedText) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set in .env');

  const prompt = `You are a professional meeting secretary. Given the following meeting notes, extract and structure them into a proper Minutes of Meeting format.

Return ONLY a valid JSON object with this exact structure:
{
  "meetingTitle": "string",
  "meetingDate": "string",
  "meetingTime": "string",
  "venue": "string",
  "chairperson": "string",
  "attendees": ["name1", "name2"],
  "agenda": ["item1", "item2"],
  "discussionPoints": [{"topic": "string", "details": "string"}],
  "actionItems": [{"action": "string", "owner": "string", "deadline": "string"}],
  "decisions": ["decision1", "decision2"],
  "nextMeetingDate": "string",
  "additionalNotes": "string"
}

Meeting Notes:
${extractedText}

Return only the JSON, no explanation, no markdown, no backticks.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || '';
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    throw new Error('Failed to parse MOM from Groq response');
  }
};

module.exports = { generateMOMFromText };