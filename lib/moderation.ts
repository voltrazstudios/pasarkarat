const CONTROL=/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
export function cleanPlainText(value:string){
  return value.normalize('NFKC').replace(CONTROL,'').replace(/\r\n?/g,'\n').trim();
}
const suspicious=[
  /<\/?script\b/i,
  /javascript\s*:/i,
  /data\s*:\s*text\/html/i,
  /on(?:error|load|click)\s*=/i,
  /\b(?:steal\s+(?:password|cookie)|credential\s+harvest|phishing\s+kit)\b/i,
  /\b(?:ransomware|keylogger|malware\s+loader)\b/i,
];
export function containsBlockedContent(value:string){return suspicious.some(pattern=>pattern.test(value));}
export function containsUnsafeMarkup(value:string){return /<\/?[a-z][^>]*>/i.test(value);}
