import styles from './malaysia-side-overlay.module.css';

export function MalaysiaSideOverlay() {
  return (
    <div className={styles.overlay} aria-hidden="true">
      <picture><source media="(min-width: 1800px)" srcSet="/images/decor/malaysia-side-overlay.webp" type="image/webp"/><img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="" draggable={false}/></picture>
    </div>
  );
}
