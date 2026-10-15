const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// CORS configuration for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'online',
    system: 'APEX F1 Strategy Server',
    aiProvider: hasOpenAI ? 'openai' : hasGemini ? 'gemini' : 'local-deterministic',
  });
});

// AI Analysis Endpoint
app.post('/api/ai-analysis', async (req, res) => {
  try {
    const { component, circuit, target, setup, telemetry } = req.body || {};

    if (!component || !circuit) {
      return res.status(400).json({ error: 'Missing required parameters: component and circuit.' });
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // 1. Try OpenAI if key is configured
    if (openAiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content: `You are a Senior Formula 1 Race Strategy and Vehicle Dynamics Engineer.
Analyze the provided component configuration and output strict JSON with the following schema:
{
  "recommendation": "Concise engineering recommendation",
  "mainBenefit": "Primary performance gain",
  "mainCompromise": "Key risk or compromise",
  "circuitRationale": "Circuit-specific aerodynamic/mechanical context",
  "tyreImplication": "Tyre thermal degradation and stint wear impact",
  "confidenceLevel": "HIGH" | "MEDIUM" | "LOW",
  "assumptions": ["Assumption 1", "Assumption 2"],
  "validationNotes": "What the driver/engineer should check during FP1/simulation"
}`,
              },
              {
                role: 'user',
                content: JSON.stringify({ component, circuit, target, setup, telemetry }),
              },
            ],
            temperature: 0.2,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn('OpenAI API returned non-200:', response.status, errText);
          throw new Error(`OpenAI error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        const parsed = JSON.parse(content);
        return res.json({ provider: 'openai', result: parsed });
      } catch (aiErr) {
        console.warn('OpenAI request failed, falling back to Gemini or local engine:', aiErr.message);
      }
    }

    // 2. Try Gemini if configured
    if (geminiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const prompt = `You are a Senior Formula 1 Race Engineer. Output strictly JSON for this setup analysis:
Input data: ${JSON.stringify({ component, circuit, target, setup, telemetry })}

Required JSON schema:
{
  "recommendation": "string",
  "mainBenefit": "string",
  "mainCompromise": "string",
  "circuitRationale": "string",
  "tyreImplication": "string",
  "confidenceLevel": "HIGH"|"MEDIUM"|"LOW",
  "assumptions": ["string"],
  "validationNotes": "string"
}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        });

        if (response.ok) {
          const gData = await response.json();
          const rawText = gData.candidates?.[0]?.content?.parts?.[0]?.text;
          const parsed = JSON.parse(rawText);
          return res.json({ provider: 'gemini', result: parsed });
        }
      } catch (geminiErr) {
        console.warn('Gemini request failed, falling back to local engine:', geminiErr.message);
      }
    }

    // 3. Fallback: Signal client to engage high-fidelity local deterministic analysis
    return res.json({
      provider: 'local-fallback',
      message: 'No external AI provider configured or available. Using local deterministic rule-based engineering engine.',
      result: null,
    });
  } catch (err) {
    console.error('Server error handling /api/ai-analysis:', err);
    res.status(500).json({ error: 'Internal strategy server error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.info(`[APEX F1 Strategy Server] running on http://localhost:${PORT}`);
});
