import type { PaginationMeta, PaginatedResult } from "../types"

export const DEFAULT_PAGE_SIZE = 20

export function buildPaginationMeta(
  total: number,
  page: number,
  perPage: number
): PaginationMeta {
  const totalPages = Math.ceil(total / perPage)
  return {
    page,
    perPage,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

export function paginateQuery(page: number, perPage = DEFAULT_PAGE_SIZE) {
  const validPage = Math.max(1, Math.floor(page))
  const validPerPage = Math.min(100, Math.max(1, Math.floor(perPage)))
  return {
    skip: (validPage - 1) * validPerPage,
    take: validPerPage,
    page: validPage,
    perPage: validPerPage,
  }
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number
): PaginatedResult<T> {
  return {
    data,
    meta: buildPaginationMeta(total, page, perPage),
  }
}
