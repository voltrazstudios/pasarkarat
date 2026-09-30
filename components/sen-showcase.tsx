'use client';

import Image from 'next/image';
import { useState } from 'react';

type SenOption = {
  id: string;
  label: string;
  image: string;
  swatch: string;
  price: string;
};

const senOptions: SenOption[] = [
  { id: 'blue', label: 'Blue SEN', image: '/images/sen/sen-blue.webp', swatch: '#2f6ed8', price: 'RM —' },
  { id: 'green', label: 'Green SEN', image: '/images/sen/sen-green.webp', swatch: '#4e9a62', price: 'RM —' },
  { id: 'red', label: 'Red SEN', image: '/images/sen/sen-red.webp', swatch: '#c94b4b', price: 'RM —' },
  { id: 'orange', label: 'Orange SEN', image: '/images/sen/sen-orange.webp', swatch: '#d8782d', price: 'RM —' },
  { id: 'teal', label: 'Teal SEN', image: '/images/sen/sen-teal.webp', swatch: '#3d9893', price: 'RM —' },
  { id: 'purple', label: 'Purple SEN', image: '/images/sen/sen-purple.webp', swatch: '#8662b5', price: 'RM —' },
];

export function SenShowcase() {
  const [selected, setSelected] = useState(0);
  const current = senOptions[selected];

  return (
    <div className="sen-product-grid">
      <article className="sen-product">
        <div className="sen-product-title">
          <h2>SEN</h2>
          <span>{current.label}</span>
        </div>

        <div className="sen-product-image">
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

        <strong className="sen-price">{current.price}</strong>
        <button className="sen-buy-button" type="button" disabled>Buy Now</button>
      </article>

      <article className="sen-product">
        <div className="sen-product-title">
          <h2>SEN 6 Pack</h2>
          <span>All six editions</span>
        </div>

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
        <strong className="sen-price">RM —</strong>
        <button className="sen-buy-button" type="button" disabled>Buy Now</button>
      </article>
    </div>
  );
}
