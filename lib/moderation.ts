const CONTROL=/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function cleanPlainText(value:string){
  return value.normalize('NFKC').replace(CONTROL,'').replace(/\r\n?/g,'\n').trim();
}

function normalized(value:string){
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/[@4]/g,'a').replace(/3/g,'e').replace(/[1!|]/g,'i')
    .replace(/0/g,'o').replace(/[5$]/g,'s').replace(/[7+]/g,'t');
}

const inappropriate=[
  /\bf[^a-z0-9]*u[^a-z0-9]*c[^a-z0-9]*k\b/i,
  /\bs[^a-z0-9]*h[^a-z0-9]*i[^a-z0-9]*t\b/i,
  /\bb[^a-z0-9]*i[^a-z0-9]*t[^a-z0-9]*c[^a-z0-9]*h\b/i,
  /\bb[^a-z0-9]*o[^a-z0-9]*d[^a-z0-9]*o[^a-z0-9]*h\b/i,
  /\bb[^a-z0-9]*a[^a-z0-9]*b[^a-z0-9]*i\b/i,
];

const suspicious=[
  /<\/?script\b/i,
  /javascript\s*:/i,
  /data\s*:\s*text\/html/i,
  /on(?:error|load|click)\s*=/i,
  /\b(?:steal\s+(?:password|cookie)|credential\s+harvest|phishing\s+kit)\b/i,
  /\b(?:ransomware|keylogger|malware\s+loader)\b/i,
];

export function containsBlockedContent(value:string){
  const text=normalized(value);
  return inappropriate.some(pattern=>pattern.test(text))||suspicious.some(pattern=>pattern.test(text));
}

export function containsUnsafeMarkup(value:string){
  return /<\/?[a-z][^>]*>/i.test(value);
}
