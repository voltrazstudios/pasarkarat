import { ArrowUpRight } from 'lucide-react';
import { PRODUCT_SUBMISSION_FORM_URL, ARCHIVE_SUGGESTION_FORM_URL } from '@/data/community';
export function CommunityCTA({ archive = false }: { archive?: boolean }) {
  return <section className="community-panel" aria-label={archive ? 'Community contribution' : 'Product submissions'}>
    <div>{archive && <p className="eyebrow">COMMUNITY CONTRIBUTION</p>}
    <h2>{archive ? 'Know Something We Should Preserve?' : 'Want to Feature Your Product?'}</h2>
    <p>{archive ? 'Help grow the Malaysian Digital Archive by suggesting a heritage object, food, tradition, place, story or other part of Malaysian culture.' : 'Sell heritage, vintage, craft, collectible or culturally relevant products? Submit your product for review and it may be featured in our collection.'}</p></div>
    <a className="button" href={archive ? ARCHIVE_SUGGESTION_FORM_URL : PRODUCT_SUBMISSION_FORM_URL} target="_blank" rel="noopener noreferrer">{archive ? 'Suggest an Archive Entry' : 'Submit Your Product'} <ArrowUpRight size={18} aria-hidden="true"/></a>
  </section>;
}
