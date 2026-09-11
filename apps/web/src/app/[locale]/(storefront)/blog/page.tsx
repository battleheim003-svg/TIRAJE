import Image from "next/image"
import Link from "next/link"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import { Card, Badge } from "@tirajeh/ui"
import styles from "./Blog.module.css"

export const metadata: Metadata = { title: "مقالات و اخبار تخصصی | تیراژه" }

export default async function BlogPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const posts = await db.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: {
      category: {
        select: { nameFa: true, nameEn: true },
      },
    },
  })

  return (
    <div>
      {/* Hero Banner */}
      <section className={styles["web-blog__hero"]}>
        <div className={styles["web-blog__hero-inner"]}>
          <h1 className={styles["web-blog__hero-title"]}>
            {fa ? "مقالات، اخبار و تحلیل‌های صنعت" : "Articles, News & Industry Insights"}
          </h1>
          <p className={styles["web-blog__hero-subtitle"]}>
            {fa
              ? "راهنماهای تخصصی ساختمانی، تحلیل بازار و مقالات مهندسی سیمان و مصالح پایه"
              : "Technical guides, market analyses and engineering articles on cement & building materials"}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className={styles["web-blog__container"]}>
        {posts.length === 0 ? (
          <div className={styles["web-blog__empty"]}>
            {fa ? "در حال حاضر مقاله‌ای منتشر نشده است." : "No articles found."}
          </div>
        ) : (
          <div className={styles["web-blog__grid"]}>
            {posts.map((post) => {
              const title = fa ? post.titleFa : post.titleEn ?? post.titleFa
              const excerpt = fa ? post.excerptFa : post.excerptEn ?? post.excerptFa
              const categoryName = post.category
                ? fa
                  ? post.category.nameFa
                  : post.category.nameEn ?? post.category.nameFa
                : null

              const publishedAt = post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString(
                    fa ? "fa-IR" : "en-US",
                    { year: "numeric", month: "short", day: "numeric" }
                  )
                : null

              return (
                <Link
                  key={post.id}
                  href={`/${locale}/blog/${post.slug}`}
                  className={styles["web-blog__card-link"]}
                >
                  <Card
                    variant="outlined"
                    interactive
                    className={styles["web-blog__card"]}
                  >
                    <div className={styles["web-blog__thumb-wrap"]}>
                      {post.featuredImage ? (
                        <Image
                          src={post.featuredImage}
                          alt={title}
                          fill
                          className={styles["web-blog__thumb"]}
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        />
                      ) : (
                        <div className={styles["web-blog__thumb-placeholder"]} />
                      )}
                    </div>

                    <div className={styles["web-blog__body"]}>
                      <div className={styles["web-blog__meta-row"]}>
                        {categoryName ? (
                          <Badge variant="primary">{categoryName}</Badge>
                        ) : (
                          <span />
                        )}
                        {publishedAt && (
                          <div className={styles["web-blog__meta"]}>
                            <span>{publishedAt}</span>
                          </div>
                        )}
                      </div>

                      <h2 className={styles["web-blog__title"]}>{title}</h2>

                      {excerpt && (
                        <p className={styles["web-blog__excerpt"]}>{excerpt}</p>
                      )}

                      <span className={styles["web-blog__read-more"]}>
                        {fa ? "مطالعه مقاله" : "Read more"} {fa ? "←" : "→"}
                      </span>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}

        {/* Pagination (if more than 9 posts) */}
        {posts.length > 9 && (
          <div className={styles["web-blog__pagination"]}>
            <span
              className={[
                styles["web-blog__page-btn"],
                styles["web-blog__page-btn--active"],
              ].join(" ")}
            >
              ۱
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
