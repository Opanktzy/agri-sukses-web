'use client';

import React, { useEffect, useRef, useState } from 'react';

const starterPrompts = [
  'Apa saja produk ekspor Agri Sukses?',
  'Jelaskan MOQ dan spesifikasi vanili Papua.',
  'Dokumen apa yang disiapkan untuk ekspor?',
  'Bantu saya menentukan produk untuk buyer.',
];

const initialMessage = {
  role: 'assistant',
  content: 'Halo! Saya Agri AI Assistant. Saya dapat membantu menjelaskan produk, spesifikasi, MOQ, proses ekspor, dokumen, dan langkah awal kerja sama. Ada yang ingin Anda ketahui?',
};

export default function AgriAIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading, open]);

  async function sendMessage(value = input) {
    const text = value.trim();
    if (!text || loading) return;
    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.filter((item) => item.role !== 'assistant' || item !== initialMessage).slice(-12) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Terjadi kesalahan saat menghubungi AI.');
      setMessages((current) => [...current, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setError(err.message || 'Koneksi ke AI gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  function resetChat() {
    setMessages([initialMessage]);
    setInput('');
    setError('');
  }

  return (
    <>
      <style>{`
        .agri-ai-root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;z-index:9999;color:#13231d}
        .agri-ai-launcher{position:fixed;right:24px;bottom:24px;border:0;border-radius:999px;background:#163f31;color:#fff;padding:14px 20px;box-shadow:0 12px 32px #0b221b40;display:flex;align-items:center;gap:10px;font-weight:700;cursor:pointer;transition:.2s}
        .agri-ai-launcher:hover{transform:translateY(-2px);background:#205640}
        .agri-ai-dot{width:9px;height:9px;border-radius:50%;background:#9be3b8;box-shadow:0 0 0 4px #9be3b822}
        .agri-ai-panel{position:fixed;right:24px;bottom:88px;width:min(410px,calc(100vw - 28px));height:min(620px,calc(100vh - 125px));background:#fbfdfb;border:1px solid #dce8df;border-radius:22px;box-shadow:0 24px 70px #0a251c35;display:flex;flex-direction:column;overflow:hidden}
        .agri-ai-header{padding:18px 18px 15px;background:linear-gradient(135deg,#163f31,#245b43);color:#fff;display:flex;justify-content:space-between;align-items:center}
        .agri-ai-brand{display:flex;gap:11px;align-items:center}.agri-ai-avatar{height:38px;width:38px;border-radius:13px;background:#ffffff1c;display:grid;place-items:center;font-size:19px}
        .agri-ai-title{font-weight:750;font-size:15px}.agri-ai-subtitle{font-size:11px;color:#c8e0d2;margin-top:3px}
        .agri-ai-iconbtn{border:0;background:#ffffff18;color:#fff;border-radius:10px;height:32px;width:32px;cursor:pointer;font-size:17px}
        .agri-ai-messages{flex:1;overflow:auto;padding:16px;background:radial-gradient(circle at top right,#eff6ef 0,transparent 45%),#f8fbf8}
        .agri-ai-bubble{max-width:88%;padding:11px 13px;margin:0 0 11px;border-radius:15px;font-size:13px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}
        .agri-ai-bubble.assistant{background:#fff;border:1px solid #e2ebe4;border-top-left-radius:5px;color:#233a2f}
        .agri-ai-bubble.user{margin-left:auto;background:#1c4a38;color:white;border-top-right-radius:5px}
        .agri-ai-quick{display:flex;flex-wrap:wrap;gap:7px;margin:4px 0 15px}
        .agri-ai-chip{border:1px solid #cbded0;background:#fff;color:#24543c;border-radius:999px;padding:7px 10px;font-size:11px;cursor:pointer}
        .agri-ai-chip:hover{background:#edf6ef}
        .agri-ai-typing{font-size:12px;color:#688271;padding:4px 2px}
        .agri-ai-error{margin:0 14px 9px;padding:9px 11px;background:#fff2ef;border:1px solid #ffd2c9;border-radius:10px;color:#963c2e;font-size:12px}
        .agri-ai-compose{padding:12px;border-top:1px solid #e4ece5;background:#fff}
        .agri-ai-form{display:flex;gap:8px;align-items:flex-end}.agri-ai-input{flex:1;resize:none;min-height:44px;max-height:110px;border:1px solid #d8e5db;border-radius:14px;padding:12px 13px;font:inherit;font-size:13px;outline:none;color:#182e24;background:#fbfdfb}
        .agri-ai-input:focus{border-color:#629477;box-shadow:0 0 0 3px #65a17a1c}.agri-ai-send{border:0;border-radius:13px;height:44px;width:46px;background:#1b4d38;color:white;font-size:18px;cursor:pointer}.agri-ai-send:disabled{opacity:.45;cursor:not-allowed}
        .agri-ai-footnote{font-size:10px;color:#8b9a90;text-align:center;margin-top:8px}
        @media(max-width:520px){.agri-ai-launcher{right:14px;bottom:14px}.agri-ai-panel{right:8px;bottom:76px;width:calc(100vw - 16px);height:calc(100vh - 96px);border-radius:18px}}
      `}</style>
      <div className="agri-ai-root">
        {open && (
          <section className="agri-ai-panel" aria-label="Agri AI Assistant">
            <header className="agri-ai-header">
              <div className="agri-ai-brand">
                <div className="agri-ai-avatar" aria-hidden="true">✦</div>
                <div><div className="agri-ai-title">Agri AI Assistant</div><div className="agri-ai-subtitle">Product & Export Information · AI Assistant</div></div>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <button className="agri-ai-iconbtn" onClick={resetChat} title="Mulai percakapan baru" aria-label="Mulai percakapan baru">↻</button>
                <button className="agri-ai-iconbtn" onClick={() => setOpen(false)} title="Tutup" aria-label="Tutup chat">×</button>
              </div>
            </header>
            <div className="agri-ai-messages">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`agri-ai-bubble ${message.role}`}>
                  {message.content}
                </div>
              ))}
              {messages.length === 1 && (
                <div className="agri-ai-quick">
                  {starterPrompts.map((prompt) => (
                    <button key={prompt} className="agri-ai-chip" onClick={() => sendMessage(prompt)} disabled={loading}>{prompt}</button>
                  ))}
                </div>
              )}
              {loading && <div className="agri-ai-typing">Agri AI sedang menyiapkan jawaban…</div>}
              <div ref={endRef} />
            </div>
            {error && <div className="agri-ai-error" role="alert">{error}</div>}
            <div className="agri-ai-compose">
              <form className="agri-ai-form" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
                <textarea
                  className="agri-ai-input"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }}
                  placeholder="Tulis pertanyaan Anda…"
                  aria-label="Tulis pesan"
                  maxLength={3000}
                  rows={1}
                />
                <button className="agri-ai-send" type="submit" disabled={!input.trim() || loading} aria-label="Kirim pesan">➤</button>
              </form>
              <div className="agri-ai-footnote">AI dapat keliru. Harga, stok, dan penawaran resmi perlu dikonfirmasi tim ekspor.</div>
            </div>
          </section>
        )}
        <button className="agri-ai-launcher" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          <span className="agri-ai-dot" /> {open ? 'Tutup AI' : 'Tanya Agri AI'}
        </button>
      </div>
    </>
  );
}
