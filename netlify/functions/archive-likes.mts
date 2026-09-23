import { getStore } from '@netlify/blobs';

const STORE_NAME = 'archive-likes';
const ID_RE = /^[a-z0-9-]{1,80}$/;
const VISITOR_RE = /^[a-zA-Z0-9_-]{8,120}$/;

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function store() {
  return getStore({ name: STORE_NAME, consistency: 'strong' });
}

function likeKey(id: string, visitorId: string) {
  return `${id}/${visitorId}`;
}

async function readCount(id: string) {
  const result = await store().list({ prefix: `${id}/` });
  return result.blobs.length;
}

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id')?.trim() ?? '';
    if (!ID_RE.test(id)) return json({ error: 'Invalid archive entry id.' }, 400);

    if (req.method === 'GET') {
      const count = await readCount(id);
      return json({ id, count });
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => null) as { action?: unknown; visitorId?: unknown } | null;
      const action = body?.action;
      const visitorId = typeof body?.visitorId === 'string' ? body.visitorId.trim() : '';

      if (action !== 'like' && action !== 'unlike') return json({ error: 'Invalid action.' }, 400);
      if (!VISITOR_RE.test(visitorId)) return json({ error: 'Invalid visitor id.' }, 400);

      const likes = store();
      const key = likeKey(id, visitorId);

      if (action === 'like') {
        // One blob per browser/visitor makes likes idempotent: the same browser
        // cannot increase the count twice, while a different browser can.
        await likes.setJSON(key, { likedAt: new Date().toISOString() });
      } else {
        await likes.delete(key);
      }

      const count = await readCount(id);
      return json({ id, count });
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    console.error('Archive likes error', error);
    return json({ error: 'Like service is temporarily unavailable.' }, 503);
  }
};

export const config = { path: '/api/archive-likes' };
