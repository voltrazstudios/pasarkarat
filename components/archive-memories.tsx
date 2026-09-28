'use client';

import { MessageCircle } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useLanguage } from './language-provider';

const VISITOR_KEY = 'pasar-karat-archive-visitor-id';
const MAX_MEMORY_LENGTH = 500;

type CommunityMemory = { id: string; name: string; text: string; createdAt: string };
type MemoryResponse = { count?: number; memories?: CommunityMemory[]; memory?: CommunityMemory; error?: string };

function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, '');
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function formatDate(value: string, language: 'en' | 'ms') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(language === 'ms' ? 'ms-MY' : 'en-MY', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function ArchiveMemoryCount({ id, name }: { id: string; name: string }) {
  const [count, setCount] = useState<number | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    let active = true;
    async function loadCount() {
      try {
        const response = await fetch(`/api/archive-memories?id=${encodeURIComponent(id)}&count=1`, { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json() as MemoryResponse;
        if (active) setCount(Math.max(0, Number(data.count) || 0));
      } catch { /* Keep the Archive card usable if the count is temporarily unavailable. */ }
    }
    void loadCount();
    const onFocus = () => void loadCount();
    window.addEventListener('focus', onFocus);
    return () => { active = false; window.removeEventListener('focus', onFocus); };
  }, [id]);

  return <span className="archive-memory-card-count" aria-label={language === 'ms' ? `${count ?? 0} memori komuniti untuk ${name}` : `${count ?? 0} community memories for ${name}`}>
    <MessageCircle size={16} aria-hidden="true" />{count === null ? '—' : count}
  </span>;
}

export function ArchiveMemories({ id, name }: { id: string; name: string }) {
  const { language } = useLanguage();
  const [memories, setMemories] = useState<CommunityMemory[]>([]);
  const [count, setCount] = useState(0);
  const [authorName, setAuthorName] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/archive-memories?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Community Memories are temporarily unavailable.');
      const data = await response.json() as MemoryResponse;
      setMemories(Array.isArray(data.memories) ? data.memories : []);
      setCount(Math.max(0, Number(data.count) || 0));
      setError('');
    } catch { setError('Community Memories are temporarily unavailable.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function submitMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const memoryText = text.trim();
    if (sending || memoryText.length < 8) return;
    setSending(true); setError(''); setSuccess('');
    try {
      const response = await fetch(`/api/archive-memories?id=${encodeURIComponent(id)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: getVisitorId(), name: authorName.trim(), text: memoryText }),
      });
      const data = await response.json().catch(() => ({})) as MemoryResponse;
      if (!response.ok) throw new Error(data.error || 'Your memory could not be shared.');
      if (data.memory) setMemories(current => [data.memory!, ...current.filter(memory => memory.id !== data.memory!.id)]);
      else await refresh();
      setCount(Math.max(0, Number(data.count) || count + 1));
      setText('');
      setSuccess('Thank you for adding your memory to the living archive.');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Your memory could not be shared.');
    } finally { setSending(false); }
  }

  const countLabel = loading ? '—' : count;
  const memoryWord = language === 'ms' ? 'Memori' : (count === 1 ? 'Memory' : 'Memories');

  return <section id="community-memories" className="archive-memories" aria-labelledby="community-memories-heading">
    <div className="archive-memories-heading">
      <div>
        <p className="eyebrow">LIVING HERITAGE</p>
        <h2 id="community-memories-heading">Community Memories</h2>
        <p>{language === 'ms' ? `Kongsi memori, cerita atau hubungan peribadi anda dengan ${name}.` : `Share a personal memory, story or connection you have with ${name}.`}</p>
      </div>
      <div className="archive-memory-heading-meta">
        <p className="archive-memory-note">Community memories are personal contributions and may not be historically verified.</p>
        <span className="archive-memory-count" aria-label={language === 'ms' ? `${count} memori komuniti` : `${count} community memories`}>
          <MessageCircle size={18} aria-hidden="true" />{countLabel} {memoryWord}
        </span>
      </div>
    </div>

    <div className="archive-memories-layout">
      <form className="archive-memory-form" onSubmit={submitMemory}>
        <h3>Share Your Memory</h3>
        <p className="archive-memory-prompt">What does this heritage remind you of?</p>
        <p className="archive-memory-safety">Keep it respectful — no links, swearing, spam or personal contact details.</p>
        <label>Your name <span>(optional)</span><input type="text" value={authorName} onChange={event => setAuthorName(event.target.value)} maxLength={40} autoComplete="name" placeholder="Your name" /></label>
        <label>Your memory<textarea value={text} onChange={event => setText(event.target.value)} minLength={8} maxLength={MAX_MEMORY_LENGTH} required rows={6} placeholder="Example: My grandparents had one like this at home..." /></label>
        <div className="archive-memory-form-bottom"><span>{text.length}/{MAX_MEMORY_LENGTH}</span><button className="button" type="submit" disabled={sending}>{sending ? 'Sharing…' : 'Share Memory'}</button></div>
        {success && <p className="archive-memory-success" role="status">{success}</p>}
        {error && <p className="archive-memory-error" role="alert">{error}</p>}
      </form>

      <div className="archive-memory-feed" aria-live="polite">
        {loading ? <div className="archive-memory-empty">Loading community memories…</div> : memories.length ? memories.map(memory => <article className="archive-memory-card" key={memory.id}>
          <div className="archive-memory-card-top"><strong data-no-translate>{memory.name || (language === 'ms' ? 'Pelawat tanpa nama' : 'Anonymous visitor')}</strong><time dateTime={memory.createdAt}>{formatDate(memory.createdAt, language)}</time></div><p data-no-translate>{memory.text}</p>
        </article>) : <div className="archive-memory-empty"><MessageCircle size={28} strokeWidth={1.4} aria-hidden="true" /><strong>Be the first to share a memory.</strong><span>Personal stories help this archive grow beyond facts and objects.</span></div>}
      </div>
    </div>
  </section>;
}
