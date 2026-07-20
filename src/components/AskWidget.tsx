import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import type { JSX } from 'preact';

interface ContentEntry {
  slug: string;
  title: string;
  description: string;
  body: string;
}

type WidgetState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Build context string that includes page URLs so the AI can reference them.
 * Each section is tagged with [PÁGINA: title | URL: /slug] so the AI knows
 * which page the content comes from and can create links.
 */
function buildContextWithRefs(entries: ContentEntry[], query: string): string {
  const queryWords = query
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents for matching
    .split(/\s+/)
    .filter(w => w.length > 2);

  // Score entries by keyword relevance
  const scored = entries.map(entry => {
    const text = `${entry.title} ${entry.description} ${entry.body}`
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let score = 0;
    for (const word of queryWords) {
      // Count occurrences
      let idx = 0;
      while ((idx = text.indexOf(word, idx)) !== -1) {
        score++;
        idx += word.length;
      }
    }
    // Boost title/description matches
    const titleText = `${entry.title} ${entry.description}`
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const word of queryWords) {
      if (titleText.includes(word)) score += 5;
    }
    return { entry, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Build context with page references
  const chunks: string[] = [];
  let totalLength = 0;
  const maxLength = 60_000;

  for (const { entry, score } of scored) {
    if (score === 0 && chunks.length > 0) continue; // skip zero-score if we have matches
    const url = entry.slug === 'index' ? '/' : `/${entry.slug}/`;
    const chunk = `[PÁGINA: ${entry.title} | URL: ${url}]\n${entry.body}`;
    if (totalLength + chunk.length > maxLength) break;
    chunks.push(chunk);
    totalLength += chunk.length;
  }

  // If nothing scored, include everything (truncated)
  if (chunks.length === 0) {
    for (const entry of entries) {
      const url = entry.slug === 'index' ? '/' : `/${entry.slug}/`;
      const chunk = `[PÁGINA: ${entry.title} | URL: ${url}]\n${entry.body}`;
      if (totalLength + chunk.length > maxLength) break;
      chunks.push(chunk);
      totalLength += chunk.length;
    }
  }

  return chunks.join('\n\n---\n\n');
}

/**
 * Convert markdown text to safe HTML.
 * Supports: bold, italic, code, headings, lists, links, line breaks.
 */
function renderMarkdown(text: string): string {
  // Escape HTML entities first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Process markdown patterns
  html = html
    // Code blocks (```...```)
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.slice(3, -3).replace(/^\w*\n/, '');
      return `<pre><code>${code}</code></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Links [text](url) — make them clickable, navigating within the site
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, url) => {
      // Internal links (starting with /) navigate directly
      if (url.startsWith('/')) {
        return `<a href="${url}" class="ask-widget-link" data-internal="true">${linkText}</a>`;
      }
      return `<a href="${url}" target="_blank" rel="noopener">${linkText}</a>`;
    })
    // Headings
    .replace(/^#### (.+)$/gm, '<h5>$1</h5>')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    // Horizontal rule / separator
    .replace(/^---$/gm, '<hr/>')
    // Emoji section headers (📄, 📌, etc.)
    .replace(/^([\u{1F4C4}\u{1F4CC}\u{1F4D6}\u{1F517}\u{2139}\u{1F4A1}].+)$/gmu, '<p class="ask-widget-section-header">$1</p>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p>')
    // Single newline within paragraphs
    .replace(/\n/g, '<br/>');

  // Wrap in paragraph tags
  html = `<p>${html}</p>`;
  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  // Fix nested block elements in paragraphs
  html = html.replace(/<p>\s*(<(?:h[2-5]|ul|ol|pre|hr|div|blockquote))/g, '$1');
  html = html.replace(/(<\/(?:h[2-5]|ul|ol|pre|hr|div|blockquote)>)\s*<\/p>/g, '$1');

  return html;
}

export default function AskWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [state, setState] = useState<WidgetState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [content, setContent] = useState<ContentEntry[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  // Load content.json once
  useEffect(() => {
    let cancelled = false;
    async function loadContent() {
      try {
        const res = await fetch('/content.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setContent(data);
          setLoadError(false);
        }
      } catch (err) {
        console.error('Failed to load content.json:', err);
        if (!cancelled) {
          setContent([]);
          setLoadError(true);
        }
      }
    }
    loadContent();
    return () => { cancelled = true; };
  }, []);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // Scroll response to top when answer arrives
  useEffect(() => {
    if (state === 'success' && responseRef.current) {
      responseRef.current.scrollTop = 0;
    }
  }, [state, answer]);

  // Handle internal link clicks in the response
  useEffect(() => {
    if (!responseRef.current) return;
    function handleLinkClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const link = target.closest('a[data-internal="true"]') as HTMLAnchorElement | null;
      if (link) {
        e.preventDefault();
        setIsOpen(false);
        window.location.href = link.getAttribute('href') || '/';
      }
    }
    const el = responseRef.current;
    el.addEventListener('click', handleLinkClick);
    return () => el.removeEventListener('click', handleLinkClick);
  }, [isOpen]);

  const handleSubmit = useCallback(async (e?: JSX.TargetedEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!question.trim() || !content || state === 'loading') return;

    setState('loading');
    setAnswer('');
    setErrorMsg('');

    try {
      const contextStr = buildContextWithRefs(content, question);
      
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), context: contextStr }),
      });

      if (!res.ok) {
        let errMsg = 'Erro ao processar pergunta';
        try {
          const data = await res.json();
          errMsg = data.error || errMsg;
        } catch { /* ignore parse error */ }
        throw new Error(errMsg);
      }

      const data = await res.json();
      setAnswer(data.answer || 'Resposta vazia recebida.');
      setState('success');
    } catch (err: any) {
      console.error('AskWidget error:', err);
      setErrorMsg(err.message || 'Erro de conexão. Tente novamente.');
      setState('error');
    }
  }, [question, content, state]);

  const handleClear = useCallback(() => {
    setQuestion('');
    setAnswer('');
    setState('idle');
    setErrorMsg('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <div class="ask-widget-container">
      <button
        class="ask-widget-trigger"
        onClick={toggleOpen}
        aria-label="Abrir assistente de busca com IA"
        aria-expanded={isOpen}
        title="Perguntar à IA"
        id="ask-widget-trigger"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span class="ask-widget-trigger-label">Perguntar à IA</span>
      </button>

      {isOpen && (
        <div class="ask-widget-panel" ref={panelRef} role="dialog" aria-label="Assistente de IA">
          <div class="ask-widget-header">
            <div class="ask-widget-header-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Assistente Itinerante</span>
            </div>
            <button class="ask-widget-close" onClick={() => setIsOpen(false)} aria-label="Fechar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form class="ask-widget-form" onSubmit={handleSubmit}>
            <div class="ask-widget-input-group">
              <input
                ref={inputRef}
                type="text"
                class="ask-widget-input"
                placeholder="Ex: Quais softwares são homologados?"
                value={question}
                onInput={(e) => setQuestion((e.target as HTMLInputElement).value)}
                disabled={state === 'loading'}
                aria-label="Sua pergunta"
                id="ask-widget-input"
                autocomplete="off"
              />
              <button
                type="submit"
                class="ask-widget-submit"
                disabled={!question.trim() || state === 'loading' || !content}
                aria-label="Enviar pergunta"
                id="ask-widget-submit"
              >
                {state === 'loading' ? (
                  <div class="ask-widget-spinner" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                  </svg>
                )}
              </button>
            </div>
          </form>

          <div class="ask-widget-response" aria-live="polite" ref={responseRef}>
            {state === 'loading' && (
              <div class="ask-widget-loading">
                <div class="ask-widget-loading-dots">
                  <span /><span /><span />
                </div>
                <p>Buscando nos manuais...</p>
              </div>
            )}

            {state === 'success' && answer && (
              <div class="ask-widget-answer">
                <div
                  class="ask-widget-answer-content"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(answer) }}
                />
                <button class="ask-widget-clear" onClick={handleClear} id="ask-widget-clear">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  Nova pergunta
                </button>
              </div>
            )}

            {state === 'error' && (
              <div class="ask-widget-error">
                <p>{errorMsg}</p>
                <button class="ask-widget-retry" onClick={() => { setState('idle'); handleSubmit(); }} id="ask-widget-retry">
                  Tentar novamente
                </button>
              </div>
            )}

            {state === 'idle' && (
              <div class="ask-widget-hint">
                {loadError ? (
                  <p>⚠️ Não foi possível carregar o conteúdo. Tente recarregar a página.</p>
                ) : !content ? (
                  <p>Carregando conteúdo...</p>
                ) : (
                  <>
                    <p>Pergunte qualquer coisa sobre os manuais da Itinerante.</p>
                    <p class="ask-widget-hint-examples">
                      Exemplos: <em>"Quais softwares são homologados?"</em>, <em>"Como funciona o fluxo de aprovação jurídica?"</em>
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
