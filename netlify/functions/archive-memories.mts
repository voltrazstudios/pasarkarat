import { getStore } from '@netlify/blobs';

const STORE_NAME = 'archive-memories';
const RATE_STORE_NAME = 'archive-memory-rate-limit';
const ID_RE = /^[a-z0-9-]{1,80}$/;
const VISITOR_RE = /^[a-zA-Z0-9_-]{8,120}$/;
const MAX_NAME_LENGTH = 40;
const MAX_MEMORY_LENGTH = 500;
const MIN_MEMORY_LENGTH = 8;
const COOLDOWN_MS = 60_000;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const GLOBAL_WINDOW_MS = 60 * 60 * 1000;
const GLOBAL_MAX_PER_WINDOW = 10;

type CommunityMemory = { id: string; name: string; text: string; createdAt: string; avatarUrl?: string | null };
type RateRecord = { lastAt: number; timestamps: number[]; lastFingerprint?: string; fingerprints?: string[] };

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' } });
}
function memoriesStore() { return getStore({ name: STORE_NAME, consistency: 'strong' }); }
function rateStore() { return getStore({ name: RATE_STORE_NAME, consistency: 'strong' }); }
function cleanName(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);
}
function cleanMemory(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\r\n?/g, '\n').trim();
}
function cleanAvatarUrl(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!base) return null;
  try {
    const avatar=new URL(value.trim());
    const supabase=new URL(base);
    if (avatar.protocol!=='https:' || avatar.origin!==supabase.origin) return null;
    if (!avatar.pathname.startsWith('/storage/v1/object/public/marketplace-profile-images/')) return null;
    return avatar.toString().slice(0,1000);
  } catch {
    return null;
  }
}
function containsLink(value: string) { return /(?:https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|io|my|co|me|gg|xyz)\b)/i.test(value); }
function containsEmail(value: string) { return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value); }
function containsPhone(value: string) { return /(?:\+?\d[\s().-]*){8,}/.test(value); }

function moderationText(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[@4]/g, 'a').replace(/[3]/g, 'e').replace(/[1!|]/g, 'i').replace(/[0]/g, 'o').replace(/[5$]/g, 's').replace(/[7+]/g, 't');
}

const PROFANITY_PATTERNS = [
  // English profanity / slurs. Separators are allowed so simple obfuscation is still caught.
  /\bf[^a-z0-9]*u[^a-z0-9]*c[^a-z0-9]*k(?:er|ing|ed|s)?\b/i,
  /\bs[^a-z0-9]*h[^a-z0-9]*i[^a-z0-9]*t(?:ty|ting|s)?\b/i,
  /\bb[^a-z0-9]*i[^a-z0-9]*t[^a-z0-9]*c[^a-z0-9]*h(?:es|y)?\b/i,
  /\bc[^a-z0-9]*u[^a-z0-9]*n[^a-z0-9]*t(?:s)?\b/i,
  /\bm[^a-z0-9]*o[^a-z0-9]*t[^a-z0-9]*h[^a-z0-9]*e[^a-z0-9]*r[^a-z0-9]*f[^a-z0-9]*u[^a-z0-9]*c[^a-z0-9]*k(?:er|ing)?\b/i,
  /\bn[^a-z0-9]*i[^a-z0-9]*g[^a-z0-9]*g[^a-z0-9]*e[^a-z0-9]*r\b/i,
  /\bf[^a-z0-9]*a[^a-z0-9]*g[^a-z0-9]*g[^a-z0-9]*o[^a-z0-9]*t\b/i,

  // Common Malaysian Malay / Manglish profanity and insults.
  /\bb[^a-z0-9]*a[^a-z0-9]*b[^a-z0-9]*i+\b/i,
  /\bb[^a-z0-9]*o[^a-z0-9]*d[^a-z0-9]*o[^a-z0-9]*h+\b/i,
  /\bb[^a-z0-9]*o[^a-z0-9]*d[^a-z0-9]*o+\b/i,
  /\bb[^a-z0-9]*a[^a-z0-9]*n[^a-z0-9]*g[^a-z0-9]*a[^a-z0-9]*n[^a-z0-9]*g+\b/i,
  /\bb[^a-z0-9]*e[^a-z0-9]*n[^a-z0-9]*g[^a-z0-9]*a[^a-z0-9]*p+\b/i,
  /\bt[^a-z0-9]*o[^a-z0-9]*l[^a-z0-9]*o[^a-z0-9]*l+\b/i,
  /\bb[^a-z0-9]*e[^a-z0-9]*b[^a-z0-9]*a[^a-z0-9]*l+\b/i,
  /\bc[^a-z0-9]*e[^a-z0-9]*l[^a-z0-9]*a[^a-z0-9]*k[^a-z0-9]*a+\b/i,
  /\bs[^a-z0-9]*i[^a-z0-9]*a[^a-z0-9]*l(?:a[^a-z0-9]*n)?\b/i,
  /\bb[^a-z0-9]*a[^a-z0-9]*n[^a-z0-9]*g[^a-z0-9]*s[^a-z0-9]*a[^a-z0-9]*t\b/i,
  /\bp[^a-z0-9]*u[^a-z0-9]*k[^a-z0-9]*i(?:[^a-z0-9]*m[^a-z0-9]*a[^a-z0-9]*k)?\b/i,
  /\bk[^a-z0-9]*i[^a-z0-9]*m[^a-z0-9]*a[^a-z0-9]*k\b/i,
  /\bl[^a-z0-9]*a[^a-z0-9]*n[^a-z0-9]*c[^a-z0-9]*a[^a-z0-9]*u\b/i,
  /\bc[^a-z0-9]*i[^a-z0-9]*b[^a-z0-9]*a[^a-z0-9]*[iy]\b/i,
  /\bp[^a-z0-9]*u[^a-z0-9]*n[^a-z0-9]*d[^a-z0-9]*[ei][^a-z0-9]*k\b/i,
  /\bs[^a-z0-9]*u[^a-z0-9]*n[^a-z0-9]*d[^a-z0-9]*a[^a-z0-9]*l\b/i,
  /\bj[^a-z0-9]*a[^a-z0-9]*l[^a-z0-9]*a[^a-z0-9]*n[^a-z0-9]*g\b/i,
  /\bp[^a-z0-9]*a[^a-z0-9]*n[^a-z0-9]*t[^a-z0-9]*a[^a-z0-9]*t\b/i,
  /\bk[^a-z0-9]*o[^a-z0-9]*n[^a-z0-9]*t[^a-z0-9]*o[^a-z0-9]*l\b/i,
  /\bm[^a-z0-9]*e[^a-z0-9]*m[^a-z0-9]*e[^a-z0-9]*k\b/i,
  /\bp[^a-z0-9]*e[^a-z0-9]*l[^a-z0-9]*e[^a-z0-9]*r\b/i,
  /\bt[^a-z0-9]*e[^a-z0-9]*t[^a-z0-9]*e[^a-z0-9]*k\b/i,
  /\bb[^a-z0-9]*u[^a-z0-9]*t[^a-z0-9]*[ou][^a-z0-9]*h\b/i,
];
function containsProfanity(value: string) { const normalized = moderationText(value); return PROFANITY_PATTERNS.some(pattern => pattern.test(normalized)); }
function looksLikeSpam(value: string) {
  const flat = value.replace(/\s+/g, ' ').trim();
  if (/(.)\1{9,}/iu.test(flat)) return true;
  if (/\b(\w{2,})\b(?:\s+\1\b){4,}/iu.test(flat)) return true;
  const letters = flat.match(/[A-Za-z]/g) ?? [];
  const uppercase = flat.match(/[A-Z]/g) ?? [];
  if (letters.length >= 24 && uppercase.length / letters.length > 0.85) return true;
  return false;
}
function fingerprint(value: string) { return moderationText(value).replace(/[^a-z0-9]+/g, '').slice(0, 500); }

async function readMemories(id: string) {
  const store = memoriesStore();
  const result = await store.list({ prefix: `${id}/` });
  const ordered = [...result.blobs].sort((a, b) => b.key.localeCompare(a.key));
  const safeMemories = (await Promise.all(ordered.map(blob => store.get(blob.key, { type: 'json' }) as Promise<CommunityMemory | null>)))
    .filter((memory): memory is CommunityMemory => Boolean(memory && typeof memory.id === 'string' && typeof memory.text === 'string'))
    .filter(memory => !containsProfanity(memory.text) && !containsProfanity(memory.name) && !containsLink(memory.text) && !containsLink(memory.name) && !looksLikeSpam(memory.text) && !looksLikeSpam(memory.name));
  return { count: safeMemories.length, memories: safeMemories.slice(0, 50) };
}

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id')?.trim() ?? '';
    if (!ID_RE.test(id)) return json({ error: 'Invalid archive entry id.' }, 400);

    if (req.method === 'GET') {
      if (url.searchParams.get('count') === '1') {
        const result = await readMemories(id);
        return json({ id, count: result.count });
      }
      return json({ id, ...(await readMemories(id)) });
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => null) as { visitorId?: unknown; name?: unknown; text?: unknown; avatarUrl?: unknown } | null;
      const visitorId = typeof body?.visitorId === 'string' ? body.visitorId.trim() : '';
      const name = cleanName(body?.name);
      const text = cleanMemory(body?.text);
      const avatarUrl = cleanAvatarUrl(body?.avatarUrl);

      if (!VISITOR_RE.test(visitorId)) return json({ error: 'Invalid visitor.' }, 400);
      if (text.length < MIN_MEMORY_LENGTH) return json({ error: `Please write at least ${MIN_MEMORY_LENGTH} characters.` }, 400);
      if (text.length > MAX_MEMORY_LENGTH) return json({ error: `Please keep your memory under ${MAX_MEMORY_LENGTH} characters.` }, 400);
      if (containsLink(text) || containsLink(name)) return json({ error: 'Links are not allowed in Community Memories.' }, 400);
      if (containsEmail(text) || containsPhone(text)) return json({ error: 'Please do not share email addresses or phone numbers in Community Memories.' }, 400);
      if (containsProfanity(text) || containsProfanity(name)) return json({ error: 'Please keep Community Memories respectful and free from offensive language.' }, 400);
      if (looksLikeSpam(text) || looksLikeSpam(name)) return json({ error: 'This looks like spam. Please write a genuine personal memory.' }, 400);

      const now = Date.now();
      const rate = rateStore();
      const rateKey = `${id}/${visitorId}`;
      const globalRateKey = `global/${visitorId}`;
      const [previous, globalPrevious] = await Promise.all([
        rate.get(rateKey, { type: 'json' }) as Promise<RateRecord | null>,
        rate.get(globalRateKey, { type: 'json' }) as Promise<RateRecord | null>,
      ]);
      const timestamps = Array.isArray(previous?.timestamps) ? previous!.timestamps.filter(time => Number.isFinite(time) && now - time < WINDOW_MS) : [];
      const globalTimestamps = Array.isArray(globalPrevious?.timestamps) ? globalPrevious!.timestamps.filter(time => Number.isFinite(time) && now - time < GLOBAL_WINDOW_MS) : [];
      if (previous?.lastAt && now - previous.lastAt < COOLDOWN_MS) return json({ error: 'Please wait one minute before sharing another memory.' }, 429);
      if (timestamps.length >= MAX_PER_WINDOW || globalTimestamps.length >= GLOBAL_MAX_PER_WINDOW) return json({ error: 'You have shared several memories recently. Please try again later.' }, 429);

      const currentFingerprint = fingerprint(text);
      const recentFingerprints = Array.isArray(globalPrevious?.fingerprints) ? globalPrevious!.fingerprints.filter(Boolean).slice(-10) : [];
      if (currentFingerprint && (previous?.lastFingerprint === currentFingerprint || recentFingerprints.includes(currentFingerprint))) return json({ error: 'You already shared this memory. Please write something different.' }, 409);

      const createdAt = new Date(now).toISOString();
      const memoryId = `${now.toString(36)}-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
      const memory: CommunityMemory = { id: memoryId, name, text, createdAt, avatarUrl };

      await memoriesStore().setJSON(`${id}/${memoryId}`, memory);
      await Promise.all([
        rate.setJSON(rateKey, { lastAt: now, timestamps: [...timestamps, now], lastFingerprint: currentFingerprint, fingerprints: [currentFingerprint] } satisfies RateRecord),
        rate.setJSON(globalRateKey, { lastAt: now, timestamps: [...globalTimestamps, now], lastFingerprint: currentFingerprint, fingerprints: [...recentFingerprints, currentFingerprint].filter(Boolean).slice(-10) } satisfies RateRecord),
      ]);

      return json({ id, memory, ...(await readMemories(id)) }, 201);
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    console.error('Archive memories error', error);
    return json({ error: 'Community Memories are temporarily unavailable.' }, 503);
  }
};

export const config = { path: '/api/archive-memories' };
