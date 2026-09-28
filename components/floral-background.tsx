'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from './floral-background.module.css';

export function FloralBackground() {
  const pathname = usePathname();
  const layer = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<number[]>([]);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      const root = layer.current;
      const main = document.querySelector('main');
      const image = root?.querySelector('img');
      if (!root || !main || !image) return;
      const origin = root.getBoundingClientRect().top;
      const anchor = pathname === '/' ? document.getElementById('categories') ?? main : main;
      const start = Math.max(0, anchor.getBoundingClientRect().top - origin);
      const end = main.getBoundingClientRect().bottom - origin;
      const height = image.getBoundingClientRect().height;
      if (!height) return;
      // Opposite corners can overlap vertically on short pages; never extend the document.
      const last = Math.max(start, end - height);
      const spacing = height + Math.max(160, height * .3);
      const count = Math.max(2, Math.floor((last - start) / spacing) + 1);
      const next = Array.from({ length: count }, (_, i) => start + (last - start) * i / (count - 1));
      setPositions(previous => previous.length === next.length && previous.every((value, i) => Math.abs(value - next[i]) < 1) ? previous : next);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    [document.body, document.querySelector('main'), document.querySelector('.header'), document.getElementById('categories'), layer.current?.querySelector('img')].forEach(element => { if (element) observer.observe(element); });
    window.addEventListener('resize', schedule);
    schedule();
    return () => { observer.disconnect(); window.removeEventListener('resize', schedule); cancelAnimationFrame(frame); };
  }, [pathname]);

  return <div ref={layer} className={styles.layer} aria-hidden="true">
    {(positions.length ? positions : [0]).map((top, index) => <Image
      key={index}
      width={825} height={825} quality={100}
      sizes="(max-width: 600px) 85vw, (max-width: 1000px) 65vw, (max-width: 1547px) 650px, (max-width: 3095px) 42vw, 1300px"
      className={index % 2 ? styles.right : styles.left}
      style={{ top, visibility: positions.length ? 'visible' : 'hidden' }}
      src={`/images/backgrounds/floral-${index % 2 ? 'bottom-right' : 'top-left'}.webp`}
      alt="" draggable={false}
    />)}
  </div>;
}
