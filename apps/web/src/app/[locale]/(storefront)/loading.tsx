import styles from "./Loading.module.css"

export default function Loading() {
  return (
    <div className={styles["web-loading__root"]} role="status" aria-label="در حال بارگذاری / Loading">
      <div className={styles["web-loading__spinner"]} aria-hidden="true" />
      <p className={styles["web-loading__text"]}>در حال بارگذاری… / Loading…</p>
    </div>
  )
}
