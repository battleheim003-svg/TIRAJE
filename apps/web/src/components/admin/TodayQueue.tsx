import React from "react"
import Link from "next/link"
import { CheckCircle2, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import type { TodayTask } from "@/lib/admin-today-tasks"
import styles from "./TodayQueue.module.css"

interface TodayQueueProps {
  tasks: TodayTask[]
  locale: string
}

export function TodayQueue({ tasks, locale }: TodayQueueProps) {
  const fa = locale === "fa"

  return (
    <section className={styles["web-adm-queue__root"]} aria-labelledby="today-queue-heading">
      <div className={styles["web-adm-queue__header"]}>
        <h2 id="today-queue-heading" className={styles["web-adm-queue__title"]}>
          <AlertCircle style={{ width: "1.125rem", height: "1.125rem" }} aria-hidden="true" />
          <span>{fa ? "کارهای امروز" : "Today's Queue"}</span>
          <span className={styles["web-adm-queue__count-badge"]}>
            {fa ? `(${tasks.length.toLocaleString("fa-IR")})` : `(${tasks.length})`}
          </span>
        </h2>
      </div>

      {tasks.length === 0 ? (
        <div className={styles["web-adm-queue__empty"]}>
          <CheckCircle2 style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />
          <span>{fa ? "همه‌چیز مرتب است ✓" : "All caught up ✓"}</span>
        </div>
      ) : (
        <ul className={styles["web-adm-queue__list"]} role="list">
          {tasks.map((task) => {
            const itemModifier =
              task.priority === "urgent"
                ? styles["web-adm-queue__item--urgent"]
                : task.priority === "warning"
                ? styles["web-adm-queue__item--warning"]
                : styles["web-adm-queue__item--info"]

            const dotModifier =
              task.priority === "urgent"
                ? styles["web-adm-queue__dot--urgent"]
                : task.priority === "warning"
                ? styles["web-adm-queue__dot--warning"]
                : styles["web-adm-queue__dot--info"]

            const actionHref = task.actionHref ? `/${locale}${task.actionHref}` : null
            const taskHref = `/${locale}${task.href}`

            return (
              <li
                key={task.id}
                className={[styles["web-adm-queue__item"], itemModifier].filter(Boolean).join(" ")}
              >
                <div className={styles["web-adm-queue__item-start"]}>
                  <span
                    className={[styles["web-adm-queue__dot"], dotModifier].filter(Boolean).join(" ")}
                    aria-hidden="true"
                  />
                  <div className={styles["web-adm-queue__text"]}>
                    <Link href={taskHref} className={styles["web-adm-queue__label"]}>
                      {task.label}
                    </Link>
                    {task.subLabel && (
                      <span className={styles["web-adm-queue__sub-label"]}>
                        {task.subLabel}
                      </span>
                    )}
                  </div>
                </div>

                {task.actionLabel && actionHref && (
                  <Link href={actionHref} className={styles["web-adm-queue__action-btn"]}>
                    <span>{task.actionLabel}</span>
                    {fa ? (
                      <ChevronLeft style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
                    ) : (
                      <ChevronRight style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
                    )}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
