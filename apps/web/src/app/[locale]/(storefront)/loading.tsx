export default function Loading() {
  return (
    <>
      <div className="sf-loading" role="status" aria-label="در حال بارگذاری / Loading">
        <div className="sf-loading__spinner" aria-hidden="true" />
        <p className="sf-loading__text">در حال بارگذاری… / Loading…</p>
      </div>

      <style>{`
        .sf-loading {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }
        .sf-loading__spinner {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-accent);
          animation: sf-spin 0.75s linear infinite;
        }
        @keyframes sf-spin { to { transform: rotate(360deg); } }
        .sf-loading__text {
          font-size: 0.875rem;
          color: var(--color-text-muted);
        }
      `}</style>
    </>
  )
}
