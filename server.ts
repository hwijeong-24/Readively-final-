import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini AI SDK (server-side only)
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Gemini AI initialization skipped:', e);
    }
  }

  // API endpoint: Evaluate Student's Read Aloud
  app.post('/api/evaluate-reading', async (req, res) => {
    try {
      const { targetSentence, studentTranscript, keyWords = [] } = req.body;

      if (!targetSentence) {
        return res.status(400).json({ error: 'targetSentence is required' });
      }

      // Target sentence tokens
      const targetTokens = new Set<string>(targetSentence.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean));
      const validKeyWords = (keyWords || []).filter((w: string) =>
        w.toLowerCase().split(/\s+/).every((tok) => targetTokens.has(tok))
      );

      // If Gemini AI client is available, attempt AI coach feedback
      if (ai) {
        try {
          const prompt = `You are a warm, encouraging English reading coach for a 5th-6th grade elementary school student in South Korea (CEFR A1 level).
The student is reading this sentence from a counterpointing picture book: "${targetSentence}"
The student's speech recognition transcript was: "${studentTranscript || '(silence or unclear)'}"
Key target vocabulary words in this specific sentence: ${JSON.stringify(validKeyWords)}

Evaluate the reading and return JSON with:
1. "practiceWords": an array of 1 or 2 specific words ONLY from this target sentence "${targetSentence}" that the student should practice or focus on. Do NOT include words that are not in this target sentence.
2. "feedbackMessage": one short, encouraging praise and tip sentence in simple English suitable for a 12-year-old (under 18 words).
3. "koreanTip": a friendly 1-sentence tip in Korean explaining how to pronounce or emphasize those 1-2 words.
4. "rating": a score from 3 to 5 (always keep it encouraging, 4 or 5 for decent match, 3 if missed many words).
5. "allWordsMatched": boolean indicating if they read most of the sentence accurately.

Respond ONLY with valid JSON.`;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });

          if (response.text) {
            const parsed = JSON.parse(response.text.trim());
            const returnedWords = Array.isArray(parsed.practiceWords) ? parsed.practiceWords : validKeyWords;
            const validWords = returnedWords.filter((w: string) => targetTokens.has(w.toLowerCase().trim()));
            const fallbackWords = Array.from<string>(targetTokens).filter((w: string) => !['a', 'an', 'the', 'is', 'in', 'on', 'at', 'to', 'he', 'she', 'it'].includes(w));
            const finalWords = (validKeyWords.length > 0 ? validKeyWords : validWords.length > 0 ? validWords : fallbackWords).slice(0, 2);

            return res.json({
              practiceWords: finalWords,
              feedbackMessage: parsed.feedbackMessage || 'Great effort! Listen to the model reading and try once more!',
              koreanTip: validKeyWords.length > 0
                ? `"${validKeyWords.join(', ')}" 발음에 유의하며 큰 소리로 따라 해보세요!`
                : (parsed.koreanTip || '원어민 소리를 듣고 단어를 자신감 있게 따라 읽어보세요!'),
              rating: parsed.rating || 5,
              allWordsMatched: parsed.allWordsMatched ?? true,
              source: 'gemini',
            });
          }
        } catch {
          // Graceful silent fallback to heuristic without error logs
        }
      }

      // Resilient heuristic analysis if AI API is unavailable or offline
      const targetWords = targetSentence.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
      const targetWordTokens = new Set(targetWords);
      const spokenWords = (studentTranscript || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
      const targetWordsSignificant = targetWords.filter((w: string) => !['a', 'an', 'the', 'is', 'in', 'on', 'at', 'to', 'he', 'she', 'it'].includes(w));
      const missedWords = targetWordsSignificant.filter((w: string) => !spokenWords.includes(w));
      const practiceWords = (validKeyWords.length > 0 ? validKeyWords : (missedWords.length > 0 ? missedWords : targetWordsSignificant.length > 0 ? targetWordsSignificant : targetWords)).slice(0, 2);

      const matchRatio = targetWords.length > 0
        ? targetWords.filter((w: string) => spokenWords.includes(w)).length / targetWords.length
        : 1;
      const rating = matchRatio >= 0.7 ? 5 : matchRatio >= 0.4 ? 4 : 3;

      res.json({
        practiceWords,
        feedbackMessage: rating === 5
          ? `Super reading! Practice pronouncing "${practiceWords.join('" and "')}" with confidence!`
          : `Good try! Let's listen closely to how "${practiceWords.join('" and "')}" sounds!`,
        koreanTip: `"${practiceWords.join(', ')}" 발음에 유의하며 큰 소리로 따라 해보세요!`,
        rating,
        allWordsMatched: matchRatio >= 0.7,
        source: 'heuristic',
      });
    } catch (err: any) {
      console.error('Reading evaluation error:', err);
      res.status(500).json({ error: 'Failed to evaluate reading' });
    }
  });

  // Mount Vite or serve static assets
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Readively server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
