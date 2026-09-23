'use client';

import { Heart } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'pasar-karat-archive-likes';
const VISITOR_KEY = 'pasar-karat-archive-visitor-id';

function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, '');
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function getLikedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

function saveLiked(id: string, liked: boolean) {
  const ids = new Set(getLikedIds());
  liked ? ids.add(id) : ids.delete(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function ArchiveLike({ id, name, detail = false }: { id: string; name: string; detail?: boolean }) {
  const [count, setCount] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [available, setAvailable] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/archive-likes?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Like service unavailable');
      const data = await response.json() as { count?: number };
      setCount(Math.max(0, Number(data.count) || 0));
      setAvailable(true);
    } catch {
      setAvailable(false);
    }
  }, [id]);

  useEffect(() => {
    setLiked(getLikedIds().includes(id));
    void refresh();

    // Keep public counts reasonably fresh without the overhead of a realtime connection.
    const intervalId = window.setInterval(() => {
      void refresh();
    }, 10_000);

    // Refresh immediately when the visitor returns to this tab.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, refresh]);

  async function toggleLike() {
    if (busy || !available) return;
    const nextLiked = !liked;
    setBusy(true);
    try {
      const response = await fetch(`/api/archive-likes?id=${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: nextLiked ? 'like' : 'unlike', visitorId: getVisitorId() }),
      });
      if (!response.ok) throw new Error('Like update failed');
      const data = await response.json() as { count?: number };
      const nextCount = Math.max(0, Number(data.count) || 0);
      setCount(nextCount);
      setLiked(nextLiked);
      saveLiked(id, nextLiked);
    } catch {
      setAvailable(false);
    } finally {
      setBusy(false);
    }
  }

  const label = liked ? `Unlike ${name}` : `Like ${name}`;
  return (
    <button
      type="button"
      className={`archive-like${liked ? ' liked' : ''}${detail ? ' detail' : ''}`}
      onClick={toggleLike}
      disabled={busy || !available}
      aria-pressed={liked}
      aria-label={available ? `${label}. ${count ?? 0} likes.` : `Likes temporarily unavailable for ${name}.`}
      title={available ? label : 'Likes temporarily unavailable'}
    >
      <Heart size={detail ? 20 : 18} fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
      <span>{count === null ? '—' : count}</span>
      {detail && <span className="archive-like-word">{count === 1 ? 'Like' : 'Likes'}</span>}
    </button>
  );
}
