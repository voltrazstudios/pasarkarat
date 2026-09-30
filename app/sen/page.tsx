import type { Metadata } from 'next';
import { SenShowcase } from '@/components/sen-showcase';
import './sen.css';

export const metadata: Metadata = {
  title: 'SEN | Pasar Karat Digital',
  description: 'A physical gift that keeps its story.',
};

export default function SenPage() {
  return (
    <main id="main" className="sen-page">
      <section className="container sen-shop">
        <div className="sen-heading">
          <p className="eyebrow">BY PASAR KARAT DIGITAL</p>
          <h1>SEN</h1>
          <p>A physical gift that keeps its story.</p>
        </div>

        <SenShowcase />
      </section>

      <section className="container sen-story">
        <div>
          <p className="eyebrow">KEEP IT. GIFT IT. PASS IT ON.</p>
          <h2>A gift that remembers where it&apos;s been.</h2>
        </div>
        <div>
          <p>
            SEN is a reusable physical token made to be gifted, kept and passed on.
            Scan it, prepare your gift, hand it to someone, and become part of its journey.
          </p>
        </div>
      </section>

      <section className="container sen-how">
        <div className="sen-section-heading">
          <p className="eyebrow">HOW SEN WORKS</p>
          <h2>One SEN. A growing story.</h2>
        </div>

        <div className="sen-steps">
          <article>
            <span>01</span>
            <h3>Scan</h3>
            <p>Scan the permanent QR on your SEN.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Activate</h3>
            <p>Become the current holder of that SEN.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Prepare</h3>
            <p>Add your message and prepare it as a gift.</p>
          </article>
          <article>
            <span>04</span>
            <h3>Give</h3>
            <p>Pass the physical SEN to someone you care about.</p>
          </article>
          <article>
            <span>05</span>
            <h3>Continue</h3>
            <p>The next holder becomes another chapter in its journey.</p>
          </article>
        </div>
      </section>

      <section className="container sen-identity">
        <div>
          <p className="eyebrow">EVERY SEN IS UNIQUE</p>
          <h2>No two journeys are the same.</h2>
        </div>
        <p>
          Every SEN has its own serial number, permanent QR and journey.
          The physical SEN stays the same. Its holders change. Its story grows.
        </p>
      </section>

      <section className="container sen-note">
        <p>
          SEN is not stored value and does not hold money. Any monetary gift is handled
          separately by the supported payment provider.
        </p>
      </section>
    </main>
  );
}
