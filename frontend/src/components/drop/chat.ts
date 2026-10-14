/** Open a Chat in the Drop panel with Drop's line and questions; with no text, just open the panel. The Copilot listens for this. */
export function openChat(chat: { text?: string; questions?: string[] } = {}) {
  window.dispatchEvent(new CustomEvent('drop:open', { detail: { text: chat.text || '', questions: chat.questions || [] } }));
}
