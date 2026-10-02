import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './ui.module.css';
export function BrandLogo() {
  return (
    <Link to="/" className={styles.brand} aria-label="ATARAXIA, inicio">
      <svg viewBox="0 0 40 44" aria-hidden="true">
        <path
          d="M4 36 19 5 35 36M11 28Q20 20 31 29M4 40Q17 30 37 39"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span>ATARAXIA</span>
    </Link>
  );
}
export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${styles.card} ${className}`}>{children}</section>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  return <span className={styles.badge}>{children}</span>;
}
export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {children && <div>{children}</div>}
    </header>
  );
}
export function Alert({
  children,
  urgent = false,
}: {
  children: ReactNode;
  urgent?: boolean;
}) {
  return (
    <div
      className={`${styles.alert} ${urgent ? styles.urgent : ''}`}
      role={urgent ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}
export function EmptyState({
  title,
  children,
  to,
  label,
}: {
  title: string;
  children: ReactNode;
  to?: string;
  label?: string;
}) {
  return (
    <div className={styles.empty}>
      <h2>{title}</h2>
      <p className="muted">{children}</p>
      {to && (
        <Link className="button" to={to}>
          {label ?? 'Continuar'}
        </Link>
      )}
    </div>
  );
}
export function Field({
  label,
  id,
  error,
  children,
  hint,
}: {
  label: string;
  id: string;
  error?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && (
        <small id={`${id}-hint`} className="muted">
          {hint}
        </small>
      )}
      {error && (
        <span className="error" id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
export function FeatureCard({
  to,
  icon,
  title,
  children,
}: {
  to: string;
  icon: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Link className={`${styles.card} ${styles.feature}`} to={to}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      <small>
        Explorar <span aria-hidden="true">↗</span>
      </small>
    </Link>
  );
}
export function Dialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={headingId}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <h2 id={headingId}>{title}</h2>
      {children}
      <div className="actions">
        <button className="secondary" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </dialog>
  );
}
export function ConfirmDialog({
  open,
  title,
  children,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <p>{children}</p>
      <div className="actions" style={{ marginBottom: 16 }}>
        <button className="danger" onClick={onConfirm}>
          Confirmar
        </button>
        <button className="secondary" onClick={onClose}>
          Conservar datos
        </button>
      </div>
    </Dialog>
  );
}
export const choiceClass = styles.choice;
