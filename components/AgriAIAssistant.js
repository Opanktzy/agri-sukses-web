/*
 * Agri AI Assistant — vanilla JavaScript widget
 * No React, JSX, Vite, or build step required.
 * Mounts automatically when this file is loaded by index.html.
 */
(() => {
  'use strict';

  const API_URL = '/api/ai-chat';
  const MAX_HISTORY = 12;
  const MAX_INPUT_LENGTH = 3000;

  const starterPrompts = [
    'Apa saja produk ekspor Agri Sukses?',
    'Jelaskan MOQ dan spesifikasi vanili Papua.',
    'Dokumen apa yang disiapkan untuk ekspor?',
    'Bantu saya menentukan produk untuk buyer.'
  ];

  const initialMessage = {
    role: 'assistant',
    content: 'Halo! Saya Agri AI Assistant. Saya dapat membantu menjelaskan produk, spesifikasi, MOQ, proses ekspor, dokumen, dan langkah awal kerja sama. Ada yang ingin Anda ketahui?'
  };

  const styles = `
    .agri-ai-root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;z-index:99999;color:#13231d}
    .agri-ai-launcher{position:fixed;right:24px;bottom:88px;z-index:99999;border:0;border-radius:999px;background:#163f31;color:#fff;padding:14px 20px;box-shadow:0 12px 32px #0b221b40;display:flex;align-items:center;gap:10px;font-weight:700;font-size:14px;cursor:pointer;transition:transform .2s,background .2s}
    .agri-ai-launcher:hover{transform:translateY(-2px);background:#205640}
    .agri-ai-launcher:focus-visible,.agri-ai-iconbtn:focus-visible,.agri-ai-chip:focus-visible,.agri-ai-send:focus-visible{outline:3px solid #e9ad13;outline-offset:3px}
    .agri-ai-dot{width:9px;height:9px;flex:0 0 9px;border-radius:50%;background:#9be3b8;box-shadow:0 0 0 4px #9be3b822}
    .agri-ai-panel{position:fixed;right:24px;bottom:152px;z-index:99998;width:min(410px,calc(100vw - 28px));height:min(620px,calc(100vh - 185px));min-height:320px;background:#fbfdfb;border:1px solid #dce8df;border-radius:22px;box-shadow:0 24px 70px #0a251c35;display:flex;flex-direction:column;overflow:hidden}
    .agri-ai-panel[hidden]{display:none}
    .agri-ai-header{padding:18px 18px 15px;background:linear-gradient(135deg,#163f31,#245b43);color:#fff;display:flex;justify-content:space-between;align-items:center;gap:12px}
    .agri-ai-brand{display:flex;gap:11px;align-items:center;min-width:0}.agri-ai-avatar{height:38px;width:38px;flex:0 0 38px;border-radius:13px;background:#ffffff1c;display:grid;place-items:center;font-size:19px}
    .agri-ai-title{font-weight:750;font-size:15px}.agri-ai-subtitle{font-size:11px;color:#c8e0d2;margin-top:3px}
    .agri-ai-header-actions{display:flex;gap:7px;flex:0 0 auto}.agri-ai-iconbtn{border:0;background:#ffffff18;color:#fff;border-radius:10px;height:32px;width:32px;cursor:pointer;font-size:17px}
    .agri-ai-messages{flex:1;overflow:auto;padding:16px;background:radial-gradient(circle at top right,#eff6ef 0,transparent 45%),#f8fbf8;overscroll-behavior:contain}
    .agri-ai-bubble{max-width:88%;padding:11px 13px;margin:0 0 11px;border-radius:15px;font-size:13px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}
    .agri-ai-bubble.assistant{background:#fff;border:1px solid #e2ebe4;border-top-left-radius:5px;color:#233a2f}
    .agri-ai-bubble.user{margin-left:auto;background:#1c4a38;color:white;border-top-right-radius:5px}
    .agri-ai-quick{display:flex;flex-wrap:wrap;gap:7px;margin:4px 0 15px}
    .agri-ai-chip{border:1px solid #cbded0;background:#fff;color:#24543c;border-radius:999px;padding:7px 10px;font-size:11px;line-height:1.4;cursor:pointer;text-align:left}
    .agri-ai-chip:hover{background:#edf6ef}.agri-ai-chip:disabled{opacity:.5;cursor:not-allowed}
    .agri-ai-typing{font-size:12px;color:#688271;padding:4px 2px}
    .agri-ai-error{margin:0 14px 9px;padding:9px 11px;background:#fff2ef;border:1px solid #ffd2c9;border-radius:10px;color:#963c2e;font-size:12px}
    .agri-ai-error[hidden]{display:none}
    .agri-ai-compose{padding:12px;border-top:1px solid #e4ece5;background:#fff}
    .agri-ai-form{display:flex;gap:8px;align-items:flex-end}.agri-ai-input{box-sizing:border-box;flex:1;resize:none;min-width:0;min-height:44px;max-height:110px;border:1px solid #d8e5db;border-radius:14px;padding:12px 13px;font:inherit;font-size:13px;outline:none;color:#182e24;background:#fbfdfb}
    .agri-ai-input:focus{border-color:#629477;box-shadow:0 0 0 3px #65a17a1c}.agri-ai-input:disabled{opacity:.65}
    .agri-ai-send{border:0;border-radius:13px;height:44px;width:46px;flex:0 0 46px;background:#1b4d38;color:white;font-size:18px;cursor:pointer}.agri-ai-send:disabled{opacity:.45;cursor:not-allowed}
    .agri-ai-footnote{font-size:10px;color:#8b9a90;text-align:center;line-height:1.4;margin-top:8px}
    @media(max-width:520px){.agri-ai-launcher{right:14px;bottom:82px;padding:12px 16px}.agri-ai-panel{right:8px;bottom:142px;width:calc(100vw - 16px);height:calc(100vh - 170px);min-height:280px;border-radius:18px}}
    @media(max-height:540px){.agri-ai-panel{height:calc(100vh - 165px);min-height:220px}}
  `;

  function createElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function mountAgriAIAssistant() {
    if (document.getElementById('agri-ai-widget')) return;

    const style = createElement('style');
    style.id = 'agri-ai-widget-styles';
    style.textContent = styles;
    document.head.appendChild(style);

    const root = createElement('div', 'agri-ai-root');
    root.id = 'agri-ai-widget';

    const panel = createElement('section', 'agri-ai-panel');
    panel.setAttribute('aria-label', 'Agri AI Assistant');
    panel.setAttribute('aria-hidden', 'true');
    panel.hidden = true;

    const header = createElement('header', 'agri-ai-header');
    const brand = createElement('div', 'agri-ai-brand');
    const avatar = createElement('div', 'agri-ai-avatar', '✦');
    avatar.setAttribute('aria-hidden', 'true');
    const brandCopy = createElement('div');
    brandCopy.append(
      createElement('div', 'agri-ai-title', 'Agri AI Assistant'),
      createElement('div', 'agri-ai-subtitle', 'Product & Export Information · AI Assistant')
    );
    brand.append(avatar, brandCopy);

    const headerActions = createElement('div', 'agri-ai-header-actions');
    const resetButton = createElement('button', 'agri-ai-iconbtn', '↻');
    resetButton.type = 'button';
    resetButton.title = 'Mulai percakapan baru';
    resetButton.setAttribute('aria-label', 'Mulai percakapan baru');
    const closeButton = createElement('button', 'agri-ai-iconbtn', '×');
    closeButton.type = 'button';
    closeButton.title = 'Tutup';
    closeButton.setAttribute('aria-label', 'Tutup chat');
    headerActions.append(resetButton, closeButton);
    header.append(brand, headerActions);

    const messagesBox = createElement('div', 'agri-ai-messages');
    messagesBox.setAttribute('aria-live', 'polite');
    messagesBox.setAttribute('aria-relevant', 'additions');

    const errorBox = createElement('div', 'agri-ai-error');
    errorBox.setAttribute('role', 'alert');
    errorBox.hidden = true;

    const compose = createElement('div', 'agri-ai-compose');
    const form = createElement('form', 'agri-ai-form');
    const textarea = createElement('textarea', 'agri-ai-input');
    textarea.placeholder = 'Tulis pertanyaan Anda…';
    textarea.setAttribute('aria-label', 'Tulis pesan');
    textarea.maxLength = MAX_INPUT_LENGTH;
    textarea.rows = 1;
    const sendButton = createElement('button', 'agri-ai-send', '➤');
    sendButton.type = 'submit';
    sendButton.disabled = true;
    sendButton.setAttribute('aria-label', 'Kirim pesan');
    form.append(textarea, sendButton);
    const footnote = createElement('div', 'agri-ai-footnote', 'AI dapat keliru. Harga, stok, dan penawaran resmi perlu dikonfirmasi tim ekspor.');
    compose.append(form, footnote);

    panel.append(header, messagesBox, errorBox, compose);

    const launcher = createElement('button', 'agri-ai-launcher');
    launcher.type = 'button';
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-controls', 'agri-ai-chat-panel');
    launcher.append(createElement('span', 'agri-ai-dot'));
    const launcherLabel = createElement('span', '', 'Tanya Agri AI');
    launcher.append(launcherLabel);
    panel.id = 'agri-ai-chat-panel';

    root.append(panel, launcher);
    document.body.appendChild(root);

    let messages = [{ ...initialMessage }];
    let loading = false;

    function scrollToBottom() {
      messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    function renderMessages() {
      messagesBox.replaceChildren();
      messages.forEach((message) => {
        const bubble = createElement('div', `agri-ai-bubble ${message.role === 'user' ? 'user' : 'assistant'}`);
        bubble.textContent = message.content;
        messagesBox.appendChild(bubble);
      });

      if (messages.length === 1) {
        const quick = createElement('div', 'agri-ai-quick');
        starterPrompts.forEach((prompt) => {
          const chip = createElement('button', 'agri-ai-chip', prompt);
          chip.type = 'button';
          chip.disabled = loading;
          chip.addEventListener('click', () => sendMessage(prompt));
          quick.appendChild(chip);
        });
        messagesBox.appendChild(quick);
      }

      if (loading) messagesBox.appendChild(createElement('div', 'agri-ai-typing', 'Agri AI sedang menyiapkan jawaban…'));
      requestAnimationFrame(scrollToBottom);
    }

    function setLoading(value) {
      loading = value;
      textarea.disabled = value;
      sendButton.disabled = value || !textarea.value.trim();
      sendButton.textContent = value ? '…' : '➤';
      renderMessages();
    }

    function showError(message) {
      errorBox.textContent = message;
      errorBox.hidden = false;
    }

    function clearError() {
      errorBox.textContent = '';
      errorBox.hidden = true;
    }

    async function sendMessage(value = textarea.value) {
      const text = String(value || '').trim();
      if (!text || loading) return;

      messages.push({ role: 'user', content: text });
      textarea.value = '';
      sendButton.disabled = true;
      clearError();
      setLoading(true);

      try {
        const history = messages
          .filter((item) => item.role === 'user' || item.role === 'assistant')
          .slice(-MAX_HISTORY);

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || `Permintaan AI gagal (HTTP ${response.status}).`);
        }
        if (!data.answer || typeof data.answer !== 'string') {
          throw new Error('AI belum mengirim jawaban yang valid. Silakan coba lagi.');
        }
        messages.push({ role: 'assistant', content: data.answer });
      } catch (error) {
        showError(error.message || 'Koneksi ke AI gagal. Silakan coba lagi.');
      } finally {
        setLoading(false);
        sendButton.disabled = !textarea.value.trim();
        textarea.focus();
      }
    }

    function setOpen(value) {
      panel.hidden = !value;
      panel.setAttribute('aria-hidden', String(!value));
      launcher.setAttribute('aria-expanded', String(value));
      launcherLabel.textContent = value ? 'Tutup AI' : 'Tanya Agri AI';
      if (value) {
        renderMessages();
        textarea.focus();
      }
    }

    launcher.addEventListener('click', () => setOpen(panel.hidden));
    closeButton.addEventListener('click', () => setOpen(false));
    resetButton.addEventListener('click', () => {
      if (loading) return;
      messages = [{ ...initialMessage }];
      clearError();
      renderMessages();
      textarea.focus();
    });

    textarea.addEventListener('input', () => {
      sendButton.disabled = loading || !textarea.value.trim();
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 110)}px`;
    });

    textarea.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      sendMessage();
    });

    renderMessages();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAgriAIAssistant, { once: true });
  } else {
    mountAgriAIAssistant();
  }
})();
