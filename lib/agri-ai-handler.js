import { COMPANY_KNOWLEDGE, DEFAULT_MODEL, NVIDIA_BASE_URL } from './agri-ai-config.js';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 15;
const MAX_MESSAGE_CHARS = 3_000;
const MAX_MESSAGES = 12;
const requestBuckets = new Map();

function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

function getAllowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function checkOrigin(origin) {
  if (!origin) return true; // Same-origin/server-to-server requests may omit Origin.
  const allowed = getAllowedOrigins();
  if (allowed.length === 0) return true; // Set ALLOWED_ORIGINS in production for strict allowlisting.
  return allowed.includes(origin.replace(/\/$/, ''));
}

function rateLimit(ip) {
  const now = Date.now();
  const bucket = requestBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    requestBuckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }
  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, remaining: MAX_REQUESTS_PER_WINDOW - bucket.count };
}

function sanitizeMessages(input) {
  if (!Array.isArray(input)) return null;
  const messages = input.slice(-MAX_MESSAGES).map((item) => {
    if (!item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string') return null;
    const content = item.content.trim();
    if (!content || content.length > MAX_MESSAGE_CHARS) return null;
    return { role: item.role, content };
  });
  if (messages.some((item) => item === null)) return null;
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') return null;
  return messages;
}

export async function handleAiChat(request) {
  const origin = request.headers.get('origin') || '';
  const corsHeaders = origin && checkOrigin(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' }
    : {};

  if (!checkOrigin(origin)) return json(403, { error: 'Origin tidak diizinkan.' });
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  if (request.method !== 'POST') return json(405, { error: 'Method tidak diizinkan. Gunakan POST.' }, corsHeaders);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: 'Body harus berupa JSON yang valid.' }, corsHeaders);
  }

  const messages = sanitizeMessages(payload?.messages);
  if (!messages) return json(400, { error: `Pesan tidak valid. Kirim 1-${MAX_MESSAGES} pesan user/assistant dan pastikan pesan terakhir berasal dari user (maksimal ${MAX_MESSAGE_CHARS} karakter per pesan).` }, corsHeaders);

  const forwarded = request.headers.get('x-forwarded-for') || '';
  const ip = forwarded.split(',')[0].trim() || 'unknown';
  const limit = rateLimit(ip);
  if (!limit.ok) {
    return json(429, { error: 'Terlalu banyak permintaan. Coba kembali sebentar lagi.' }, {
      ...corsHeaders,
      'Retry-After': String(limit.retryAfter),
    });
  }

  const apiKey = process.env.NVIDIA_API_KEY?.trim();
  if (!apiKey) return json(503, { error: 'Layanan AI belum dikonfigurasi. NVIDIA_API_KEY belum tersedia di server.' }, corsHeaders);

  const model = process.env.NVIDIA_MODEL || DEFAULT_MODEL;
  const systemMessage = {
    role: 'system',
    content: `You are Agri AI Assistant, the website information assistant for PT Agri Sukses Exportindo.\n\n${COMPANY_KNOWLEDGE}`,
  };

  let upstream;
  try {
    upstream = await fetch(`${process.env.NVIDIA_API_BASE_URL || NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [systemMessage, ...messages],
        temperature: 0.35,
        top_p: 0.9,
        max_tokens: 900,
        stream: false,
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch (error) {
    const message = error?.name === 'TimeoutError'
      ? 'Permintaan ke layanan AI melewati batas waktu. Silakan coba lagi.'
      : 'Tidak dapat terhubung ke layanan NVIDIA AI. Silakan coba kembali.';
    return json(502, { error: message }, corsHeaders);
  }

    if (!upstream.ok) {
    const rawError = await upstream.text();
    console.error("NVIDIA API ERROR:", upstream.status, rawError);

    const status = upstream.status === 429 ? 503 : 502;
    return json(status, {
      error: upstream.status === 401 || upstream.status === 403
        ? 'Autentikasi NVIDIA gagal. Periksa NVIDIA_API_KEY di pengaturan deployment.'
        : upstream.status === 429
          ? 'Kuota atau kapasitas endpoint NVIDIA sedang terbatas. Coba kembali nanti.'
          : `NVIDIA AI gagal (${upstream.status}): ${rawError}`, // Sementara tampilkan detailnya untuk debugging
    }, corsHeaders);
  }


  let result;
  try {
    result = await upstream.json();
  } catch {
    return json(502, { error: 'Respons dari NVIDIA tidak dapat dibaca.' }, corsHeaders);
  }
  const answer = result?.choices?.[0]?.message?.content;
  if (typeof answer !== 'string' || !answer.trim()) {
    return json(502, { error: 'NVIDIA tidak mengembalikan jawaban teks.' }, corsHeaders);
  }

  return json(200, {
    answer: answer.trim(),
    model,
    usage: result?.usage ? {
      prompt_tokens: result.usage.prompt_tokens,
      completion_tokens: result.usage.completion_tokens,
      total_tokens: result.usage.total_tokens,
    } : undefined,
  }, {
    ...corsHeaders,
    'Cache-Control': 'no-store',
    'X-RateLimit-Remaining': String(limit.remaining),
  });
}
