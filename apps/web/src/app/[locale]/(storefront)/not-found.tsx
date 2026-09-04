import Link from "next/link"

export default function NotFound() {
  return (
    <>
      <div className="nf-root">
        <p className="nf-code" aria-hidden="true">404</p>
        <h1 className="nf-title">
          صفحه مورد نظر یافت نشد
          <br />
          <span className="nf-title-en">Page not found</span>
        </h1>
        <p className="nf-desc">
          آدرس اشتباه است یا صفحه حذف شده است.
          <br />
          The page you are looking for doesn&apos;t exist or has been removed.
        </p>
        <div className="nf-actions">
          <Link href="/fa" className="nf-btn nf-btn--primary">صفحه اصلی</Link>
          <Link href="/en" className="nf-btn nf-btn--outline">Home</Link>
        </div>
      </div>

      <style>{`
        .nf-root {
          min-height: 70vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          text-align: center;
        }
        .nf-code {
          font-size: clamp(5rem, 15vw, 8rem);
          font-weight: 900;
          color: var(--color-border);
          line-height: 1;
          letter-spacing: -0.04em;
          user-select: none;
          margin-bottom: 0.5rem;
        }
        .nf-title {
          font-size: clamp(1.25rem, 3vw, 1.75rem);
          font-weight: 700;
          color: var(--color-text);
          line-height: 1.5;
          margin-bottom: 0.875rem;
        }
        .nf-title-en {
          font-size: 1rem;
          font-weight: 400;
          color: var(--color-text-secondary);
        }
        .nf-desc {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          line-height: 1.7;
          max-width: 30ch;
          margin-bottom: 2rem;
        }
        .nf-actions { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; }
        .nf-btn {
          padding: 0.5625rem 1.5rem;
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
          transition: background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
        }
        .nf-btn--primary {
          background-color: var(--color-accent);
          color: #fff;
          border: 1.5px solid var(--color-accent);
        }
        .nf-btn--primary:hover { background-color: var(--color-accent-hover); border-color: var(--color-accent-hover); }
        .nf-btn--outline {
          background: none;
          color: var(--color-text-secondary);
          border: 1.5px solid var(--color-border);
        }
        .nf-btn--outline:hover { border-color: var(--color-accent); color: var(--color-accent); }
      `}</style>
    </>
  )
}
