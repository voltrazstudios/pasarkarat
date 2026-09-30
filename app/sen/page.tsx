import type { Metadata } from 'next';
import Image from 'next/image';
import { SenShowcase } from '@/components/sen-showcase';
import './sen.css';

export const metadata: Metadata = {
  title: 'SEN | Pasar Karat Digital',
  description: 'A physical gift that keeps its story.',
};

const steps = [
  {
    number: '01',
    title: 'Scan',
    text: 'Scan the permanent QR on your SEN.',
    image: '/images/sen/steps/scan.webp',
  },
  {
    number: '02',
    title: 'Activate',
    text: 'Become the current holder of that SEN.',
    image: '/images/sen/steps/activate.webp',
  },
  {
    number: '03',
    title: 'Prepare',
    text: 'Add your message and prepare it as a gift.',
    image: '/images/sen/steps/prepare.webp',
  },
  {
    number: '04',
    title: 'Give',
    text: 'Pass the physical SEN to someone you care about.',
    image: '/images/sen/steps/give.webp',
  },
  {
    number: '05',
    title: 'Continue',
    text: 'The next holder becomes another chapter in its journey.',
    image: '/images/sen/steps/continue.webp',
  },
];

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
          {steps.map((step) => (
            <article key={step.number}>
              <div className="sen-step-image">
                <Image
                  src={step.image}
                  alt={`${step.title} SEN step`}
                  fill
                  sizes="(max-width: 760px) 100vw, (max-width: 1000px) 50vw, 33vw"
                />
              </div>

              <div className="sen-step-copy">
                <span>{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </div>
            </article>
          ))}
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
    </main>
  );
}
