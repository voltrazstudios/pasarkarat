'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type SenOption = {
  id: string;
  label: string;
  image: string;
  swatch: string;
  price: string;
  learnMoreUrl: string;
};

const senOptions: SenOption[] = [
  { id: 'blue', label: 'Blue SEN', image: '/images/sen/sen-blue.webp', swatch: '#2f6ed8', price: 'RM —', learnMoreUrl: '#' },
  { id: 'green', label: 'Green SEN', image: '/images/sen/sen-green.webp', swatch: '#4e9a62', price: 'RM —', learnMoreUrl: '#' },
  { id: 'red', label: 'Red SEN', image: '/images/sen/sen-red.webp', swatch: '#c94b4b', price: 'RM —', learnMoreUrl: '#' },
  { id: 'orange', label: 'Orange SEN', image: '/images/sen/sen-orange.webp', swatch: '#d8782d', price: 'RM —', learnMoreUrl: '#' },
  { id: 'teal', label: 'Teal SEN', image: '/images/sen/sen-teal.webp', swatch: '#3d9893', price: 'RM —', learnMoreUrl: '#' },
  { id: 'purple', label: 'Purple SEN', image: '/images/sen/sen-purple.webp', swatch: '#8662b5', price: 'RM —', learnMoreUrl: '#' },
];

const sixPackLearnMoreUrl = '#';

export function SenShowcase() {
  const [selected, setSelected] = useState(0);
  const [productSlide, setProductSlide] = useState(0);
  const productGridRef = useRef<HTMLDivElement>(null);
  const current = senOptions[selected];

  const showProduct = (index: number) => {
    setProductSlide(index);
    const grid = productGridRef.current;
    if (grid) grid.scrollTo({ left: grid.clientWidth * index, behavior: 'smooth' });
  };

  return (
    <div className="sen-product-carousel">
      <button
        type="button"
        className="sen-carousel-button sen-carousel-prev"
        onClick={() => showProduct(0)}
        disabled={productSlide === 0}
        aria-label="Show SEN"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        className="sen-carousel-button sen-carousel-next"
        onClick={() => showProduct(1)}
        disabled={productSlide === 1}
        aria-label="Show SEN 6 Pack"
      >
        <ChevronRight size={22} />
      </button>

      <div
        className="sen-product-grid"
        ref={productGridRef}
        onScroll={event => {
          const grid = event.currentTarget;
          setProductSlide(Math.round(grid.scrollLeft / grid.clientWidth));
        }}
      >
      <article className="sen-product">
        <div className="sen-product-image sen-single-image">
          <Image
            key={current.image}
            className="sen-changing-image"
            src={current.image}
            alt={current.label}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 50vw"
          />
        </div>

        <div className="sen-colour-picker" role="group" aria-label="Choose SEN colour">
          {senOptions.map((option, index) => (
            <button
              key={option.id}
              type="button"
              className={selected === index ? 'selected' : undefined}
              onClick={() => setSelected(index)}
              aria-label={`Show ${option.label}`}
              aria-pressed={selected === index}
              title={option.label}
            >
              <span style={{ backgroundColor: option.swatch }} />
            </button>
          ))}
        </div>

        <div className="sen-purchase">
          <h2>SEN</h2>
          <strong className="sen-price">{current.price}</strong>

          <div className="sen-purchase-actions">
            <a className="sen-learn-button" href={current.learnMoreUrl}>Learn More</a>
            <button className="sen-buy-button" type="button" aria-label={`Buy ${current.label}`}>
              Buy Now
            </button>
          </div>
        </div>
      </article>

      <article className="sen-product">
        <div className="sen-product-image">
          <Image
            src="/images/sen/sen-6-pack.webp"
            alt="SEN 6 Pack"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 50vw"
          />
        </div>

        <div className="sen-pack-space" aria-hidden="true" />

        <div className="sen-purchase">
          <h2>SEN 6 Pack</h2>
          <strong className="sen-price">RM —</strong>

          <div className="sen-purchase-actions">
            <a className="sen-learn-button" href={sixPackLearnMoreUrl}>Learn More</a>
            <button className="sen-buy-button" type="button" aria-label="Buy SEN 6 Pack">
              Buy Now
            </button>
          </div>
        </div>
      </article>
      </div>
    </div>
  );
}
