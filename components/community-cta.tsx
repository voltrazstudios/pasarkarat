import { ArrowUpRight } from 'lucide-react';
import { ARCHIVE_SUGGESTION_FORM_URL } from '@/data/community';

export function CommunityCTA() {
  return <section className="community-panel" aria-label="Community contribution">
    <div>
      <p className="eyebrow">COMMUNITY CONTRIBUTION</p>
      <h2>Know Something We Should Preserve?</h2>
      <p>Help grow the Malaysian Digital Archive by suggesting a heritage object, food, tradition, place, story or other part of Malaysian culture.</p>
    </div>
    <a className="button" href={ARCHIVE_SUGGESTION_FORM_URL} target="_blank" rel="noopener noreferrer">Suggest an Archive Entry <ArrowUpRight size={18} aria-hidden="true"/></a>
  </section>;
}
