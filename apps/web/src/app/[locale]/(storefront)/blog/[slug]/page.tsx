import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import { Badge, Button } from "@tirajeh/ui"
import styles from "./Post.module.css"

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await db.post.findUnique({ where: { slug } })
  if (!post) return {}
  return {
    title: `${post.titleFa} | تیراژه`,
    description: post.excerptFa?.slice(0, 160) ?? undefined,
    openGraph: post.featuredImage ? { images: [post.featuredImage] } : undefined,
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const fa = locale === "fa"

  const post = await db.post.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      category: {
        select: { nameFa: true, nameEn: true },
      },
    },
  })

  if (!post || post.archivedAt) notFound()

  const title = fa ? post.titleFa : post.titleEn ?? post.titleFa
  const categoryName = post.category
    ? fa
      ? post.category.nameFa
      : post.category.nameEn ?? post.category.nameFa
    : null

  const publishedAt = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(
        fa ? "fa-IR" : "en-US",
        { dateStyle: "long" }
      )
    : null

  return (
    <article className={styles["web-post__root"]}>
      {/* Back Link */}
      <Link href={`/${locale}/blog`} className={styles["web-post__back-link"]}>
        {fa ? "← بازگشت به مقالات" : "← Back to Articles"}
      </Link>

      {/* Featured Hero Image */}
      {post.featuredImage && (
        <div className={styles["web-post__hero-wrap"]}>
          <Image
            src={post.featuredImage}
            alt={title}
            fill
            className={styles["web-post__hero-img"]}
            priority
            sizes="(min-width: 768px) 48rem, 100vw"
          />
        </div>
      )}

      {/* Article Header */}
      <header className={styles["web-post__header"]}>
        <div className={styles["web-post__meta"]}>
          {categoryName && <Badge variant="primary">{categoryName}</Badge>}
          {publishedAt && <span>{publishedAt}</span>}
        </div>
        <h1 className={styles["web-post__title"]}>{title}</h1>
      </header>

      {/* Prose Body */}
      <div className={styles["web-post__prose"]}>
        {post.contentFa ? (
          <div dangerouslySetInnerHTML={{ __html: post.contentFa }} />
        ) : (
          <>
            <p>
              {fa
                ? post.excerptFa || "صنعت سیمان و مصالح ساختمانی یکی از پایه‌ای‌ترین صنایع در توسعه زیرساخت‌های کشور به شمار می‌رود."
                : post.excerptEn || "The cement and construction materials industry is among the most foundational sectors in national infrastructure."}
            </p>
            <blockquote>
              {fa
                ? "انتخاب صحیح نوع سیمان و رعایت استانداردهای ملی تضمین‌کننده دوام و استحکام سازه‌های عمرانی است."
                : "Selecting the correct cement grade and adhering to national standards guarantees structural longevity."}
            </blockquote>
            <h2>{fa ? "مشخصات فنی و کاربردها" : "Technical Specifications & Applications"}</h2>
            <p>
              {fa
                ? "برای استعلام جزئیات مشخصات آزمایشگاهی، تاییدیه‌های استاندارد و شیوه بارگیری با واحد فنی و مهندسی تیراژه تماس حاصل فرمایید."
                : "For laboratory reports, certifications and delivery details, contact the Tirajeh technical team."}
            </p>
          </>
        )}
      </div>

      {/* Footer Navigation */}
      <footer className={styles["web-post__footer"]}>
        <Link href={`/${locale}/blog`} className={styles["web-post__footer-back"]}>
          {fa ? "← مشاهده تمام مقالات" : "← View All Articles"}
        </Link>
        <Button asChild variant="secondary">
          <Link href={`/${locale}/products`}>
            {fa ? "مشاهده محصولات مرتبط" : "Browse Products"}
          </Link>
        </Button>
      </footer>
    </article>
  )
}
