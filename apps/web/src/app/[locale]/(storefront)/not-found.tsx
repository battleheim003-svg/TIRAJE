import Link from "next/link"
import styles from "./NotFound.module.css"

export default function NotFound() {
  return (
    <div className={styles["web-notfound__root"]}>
      <p className={styles["web-notfound__code"]} aria-hidden="true">404</p>
      <h1 className={styles["web-notfound__title"]}>
        صفحه مورد نظر یافت نشد
        <br />
        <span className={styles["web-notfound__titleEn"]}>Page not found</span>
      </h1>
      <p className={styles["web-notfound__desc"]}>
        آدرس اشتباه است یا صفحه حذف شده است.
        <br />
        The page you are looking for doesn&apos;t exist or has been removed.
      </p>
      <div className={styles["web-notfound__actions"]}>
        <Link href="/fa" className={`${styles["web-notfound__btn"]} ${styles["web-notfound__btnPrimary"]}`}>صفحه اصلی</Link>
        <Link href="/en" className={`${styles["web-notfound__btn"]} ${styles["web-notfound__btnOutline"]}`}>Home</Link>
      </div>
    </div>
  )
}
