import { handleAiChat } from '../lib/agri-ai-handler.js';

// Vercel Serverless Function (Node.js runtime)
export default async function handler(req, res) {
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
  const request = new Request(`https://${req.headers.host || 'localhost'}${req.url || '/api/ai-chat'}`, {
    method: req.method,
    headers: req.headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : rawBody,
  });
  const response = await handleAiChat(request);
  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));
  const text = await response.text();
  if (!text) return res.end();
  res.send(text);
}
