import styles from './malaysia-side-overlay.module.css';

export function MalaysiaSideOverlay() {
  return (
    <div className={styles.overlay} aria-hidden="true">
      <img src="/images/decor/malaysia-side-overlay.png" alt="" draggable={false} />
    </div>
  );
}
