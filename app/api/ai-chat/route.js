import { handleAiChat } from '../../../lib/agri-ai-handler.js';

// Next.js App Router alternative. Use this file instead of /api/ai-chat.js
// when the repository uses the app/ directory.
export async function POST(request) {
  return handleAiChat(request);
}

export async function OPTIONS(request) {
  return handleAiChat(request);
}
