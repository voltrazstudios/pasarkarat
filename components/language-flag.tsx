export function LanguageFlag({ country }: { country: 'my' | 'gb' }) {
  if (country === 'my') {
    return <svg className="language-flag" viewBox="0 0 28 20" role="img" aria-label="Malaysia flag">
      <rect width="28" height="20" fill="#fff"/>
      {[0,4,8,12,16].map(y=><rect key={y} x="0" y={y} width="28" height="2" fill="#cc0001"/>)}
      <rect x="0" y="0" width="14" height="10" fill="#010066"/>
      <circle cx="6" cy="5" r="3.2" fill="#ffcc00"/>
      <circle cx="7.2" cy="4.5" r="2.7" fill="#010066"/>
      <path d="M10.8 2.1l.45 1.35 1.4-.15-.95 1.03.82 1.15-1.38-.3-.58 1.29-.15-1.4-1.4-.15 1.2-.73-.43-1.35 1.02.96z" fill="#ffcc00"/>
    </svg>;
  }
  return <svg className="language-flag" viewBox="0 0 28 20" role="img" aria-label="United Kingdom flag">
    <rect width="28" height="20" fill="#012169"/>
    <path d="M0 0l28 20M28 0L0 20" stroke="#fff" strokeWidth="4"/>
    <path d="M0 0l28 20M28 0L0 20" stroke="#c8102e" strokeWidth="2"/>
    <path d="M14 0v20M0 10h28" stroke="#fff" strokeWidth="6"/>
    <path d="M14 0v20M0 10h28" stroke="#c8102e" strokeWidth="3.2"/>
  </svg>;
}
