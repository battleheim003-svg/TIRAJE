import Image from "next/image"
import Link from "next/link"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "مقالات | تیراژه" }
export default async function BlogPage() {
  const locale = await getLocale()
  const isRtl = locale === "fa"
  const posts: any[] = await db.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  })
  return (
    <>
      <div className="bp-root">
        <h1 className="bp-title">
          {isRtl ? "مقالات و اخبار" : "Articles & News"}
        </h1>
        <p className="bp-subtitle">
          {isRtl
            ? "راهنماها، اخبار صنعت و مقالات فنی درباره سیمان و مصالح ساختمانی"
            : "Guides, industry news and technical articles on cement and construction materials"}
        </p>
        {posts.length === 0 ? (
          <div className="bp-empty">
            {isRtl ? "مقاله‌ای یافت نشد." : "No articles found."}
          </div>
        ) : (
          <div className="bp-grid">
            {posts.map((post) => {
              const title = locale === "fa" ? post.titleFa : (post.titleEn ?? post.titleFa)
              const excerpt = locale === "fa" ? post.excerptFa : (post.excerptEn ?? post.excerptFa)
              const publishedAt = post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString(
                    isRtl ? "fa-IR" : "en-US",
                    { year: "numeric", month: "short", day: "numeric" }
                  )
                : null
              return (
                <Link
                  key={post.id}
                  href={`/${locale}/blog/${post.slug}`}
                  className="bp-card"
                >
                  {post.featuredImage ? (
                    <div className="bp-card__img-wrap">
                      <Image
                        src={post.featuredImage}
                        alt={title}
                        fill
                        className="bp-card__img"
                      />
                    </div>
                  ) : (
                    <div className="bp-card__placeholder" />
                  )}
                  <div className="bp-card__body">
                    {publishedAt && (
                      <p className="bp-card__date">{publishedAt}</p>
                    )}
                    <h2 className="bp-card__title">
                      {title}
                    </h2>
                    {excerpt && (
                      <p className="bp-card__excerpt">{excerpt}</p>
                    )}
                    <span className="bp-card__read-more">
                      {isRtl ? "ادامه مطلب" : "Read more"} {isRtl ? "←" : "→"}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
      <style>{`
        .bp-root {
          max-width: 56rem;
          margin: 0 auto;
          padding-inline: 1rem;
          padding-block: 2rem;
        }
        .bp-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 0.5rem;
        }
        .bp-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin-bottom: 2rem;
        }
        .bp-empty {
          text-align: center;
          padding-block: 5rem;
          color: var(--color-text-muted);
        }
        .bp-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 640px) {
          .bp-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .bp-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .bp-card {
          display: flex;
          flex-direction: column;
          background-color: var(--color-surface);
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border-subtle);
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          transition: box-shadow var(--transition-fast);
        }
        .bp-card:hover {
          box-shadow: var(--shadow-md);
        }
        .bp-card__img-wrap {
          position: relative;
          height: 11rem;
          overflow: hidden;
          background-color: var(--color-background);
        }
        .bp-card__img {
          object-fit: cover;
          transition: transform var(--transition-base);
        }
        .bp-card:hover .bp-card__img {
          transform: scale(1.05);
        }
        .bp-card__placeholder {
          height: 11rem;
          background-color: var(--color-border-subtle);
        }
        .bp-card__body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .bp-card__date {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin-bottom: 0.5rem;
        }
        .bp-card__title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: 0.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color var(--transition-fast);
        }
        .bp-card:hover .bp-card__title {
          color: var(--color-accent);
        }
        .bp-card__excerpt {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.5;
        }
        .bp-card__read-more {
          display: inline-block;
          margin-top: auto;
          padding-top: 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--color-accent);
        }
        .bp-card:hover .bp-card__read-more {
          text-decoration: underline;
        }
      `}</style>
    </>
  )
}
