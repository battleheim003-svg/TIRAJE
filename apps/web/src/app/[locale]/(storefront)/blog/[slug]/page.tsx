import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await db.post.findUnique({ where: { slug } })
  if (!post) return {}
  const p = post as any
  return {
    title: `${p.titleFa} | تیراژه`,
    description: p.excerptFa?.slice(0, 160) ?? undefined,
    openGraph: p.featuredImage ? { images: [p.featuredImage] } : undefined,
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const isRtl = locale === "fa"

  const post: any = await db.post.findUnique({
    where: { slug, status: "PUBLISHED" },
  })

  if (!post) notFound()

  const title = locale === "fa" ? post.titleFa : (post.titleEn ?? post.titleFa)
  const publishedAt = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(
        isRtl ? "fa-IR" : "en-US",
        { dateStyle: "long" }
      )
    : null

  return (
    <>
      <div className="bs-root">
        {/* Back */}
        <Link
          href={`/${locale}/blog`}
          className="bs-back-link"
        >
          {isRtl ? "← بازگشت به مقالات" : "← Back to Articles"}
        </Link>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="bs-featured-img-wrap">
            <Image
              src={post.featuredImage}
              alt={title}
              fill
              className="bs-featured-img"
              priority
            />
          </div>
        )}

        {/* Meta */}
        {publishedAt && (
          <p className="bs-date">{publishedAt}</p>
        )}

        {/* Title */}
        <h1 className="bs-title">
          {title}
        </h1>

        {/* Content placeholder — in production this would be rendered MDX/rich-text */}
        <div className="bs-content">
          {isRtl ? (
            <p className="bs-placeholder-text">
              محتوای کامل مقاله در این بخش نمایش داده می‌شود.
            </p>
          ) : (
            <p className="bs-placeholder-text">
              Full article content is rendered here.
            </p>
          )}
        </div>

        {/* Share / Back */}
        <div className="bs-footer">
          <Link
            href={`/${locale}/blog`}
            className="bs-footer-back"
          >
            {isRtl ? "← همه مقالات" : "← All Articles"}
          </Link>
          <Link
            href={`/${locale}/products`}
            className="bs-footer-products"
          >
            {isRtl ? "مشاهده محصولات" : "Browse Products"}
          </Link>
        </div>
      </div>

      <style>{`
        .bs-root {
          max-width: 42rem;
          margin: 0 auto;
          padding-inline: 1rem;
          padding-block: 2rem;
        }
        .bs-back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          color: var(--color-text-muted);
          text-decoration: none;
          margin-bottom: 1.5rem;
          transition: color var(--transition-fast);
        }
        .bs-back-link:hover {
          color: var(--color-text);
        }
        .bs-featured-img-wrap {
          position: relative;
          height: 16rem;
          border-radius: var(--radius-xl);
          overflow: hidden;
          margin-bottom: 2rem;
          background-color: var(--color-background);
        }
        @media (min-width: 640px) {
          .bs-featured-img-wrap {
            height: 20rem;
          }
        }
        .bs-featured-img {
          object-fit: cover;
        }
        .bs-date {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin-bottom: 0.75rem;
        }
        .bs-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text);
          line-height: 1.25;
          margin-bottom: 1.5rem;
        }
        @media (min-width: 640px) {
          .bs-title {
            font-size: 1.875rem;
          }
        }
        .bs-content {
          color: var(--color-text-secondary);
          line-height: 1.625;
        }
        .bs-placeholder-text {
          color: var(--color-text-muted);
          font-style: italic;
        }
        .bs-footer {
          margin-top: 3rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--color-border-subtle);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .bs-footer-back {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          text-decoration: none;
          transition: color var(--transition-fast);
        }
        .bs-footer-back:hover {
          color: var(--color-text);
        }
        .bs-footer-products {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-accent);
          text-decoration: none;
        }
        .bs-footer-products:hover {
          text-decoration: underline;
        }
      `}</style>
    </>
  )
}
