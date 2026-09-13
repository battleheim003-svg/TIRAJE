import { cache } from "react"
import { db } from "@tirajeh/database"
import { tehranDayStart, tehranDateKey } from "@tirajeh/shared"

export interface DailyStat {
  dateKey: string          // "1405-06-21"
  revenueToman: number
  weightTon: number
}

export interface BrandStat {
  brandId: string
  brandNameFa: string
  revenueToman: number
  weightTon: number
}

export interface ProvinceStat {
  province: string
  revenueToman: number
  orderCount: number
}

export interface ConversionStat {
  quotesTotal: number
  quotesConverted: number   // QuoteRequest که به سفارش تبدیل شده
  rate: number              // 0-1
}

export interface SalesStats {
  daily: DailyStat[]        // ۳۰ روز، قدیمی‌ترین اول
  byBrand: BrandStat[]      // بیشترین درآمد، ۱۰ تا
  byProvince: ProvinceStat[] // بیشترین سفارش، ۸ تا
  conversion: ConversionStat
}

const VALID_ORDER_STATUSES = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"]

export const getSalesStats = cache(async (): Promise<SalesStats> => {
  try {
    const today = tehranDayStart()
    const thirtyDaysAgo = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000)

    // ایجاد آرایه ۳۰ روز برای روزهای بدون سفارش
    const dailyMap = new Map<string, { revenueToman: number; weightTon: number }>()
    const allDateKeys: string[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dk = tehranDateKey(d)
      allDateKeys.push(dk)
      dailyMap.set(dk, { revenueToman: 0, weightTon: 0 })
    }

    const [orders, quotesTotal, quotesConverted] = await Promise.all([
      // سفارش‌های معتبر ۳۰ روز اخیر به همراه آیتم‌ها و برند محصول
      db.order.findMany({
        where: {
          status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] },
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          id: true,
          totalAmount: true,
          shippingProvince: true,
          createdAt: true,
          items: {
            select: {
              quantity: true,
              totalPrice: true,
              weightKg: true,
              product: {
                select: {
                  brandId: true,
                  brand: {
                    select: { id: true, nameFa: true },
                  },
                },
              },
            },
          },
        },
      }),

      // استعلام‌های ۳۰ روز اخیر
      db.quoteRequest.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),

      // استعلام‌های تبدیل شده / پاسخ‌داده‌شده ۳۰ روز اخیر (وضعیت ACCEPTED یا QUOTED)
      db.quoteRequest.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { in: ["ACCEPTED", "QUOTED"] },
        },
      }),
    ])

    // پردازش daily stats
    const brandMap = new Map<string, { brandNameFa: string; revenueToman: number; weightTon: number }>()
    const provinceMap = new Map<string, { revenueToman: number; orderCount: number }>()

    for (const ord of orders) {
      const dk = tehranDateKey(ord.createdAt)
      const curDaily = dailyMap.get(dk)
      const orderRev = Number(ord.totalAmount)

      let orderWeightKg = 0
      for (const item of ord.items) {
        const itemKg = item.weightKg != null ? Number(item.weightKg) : 50
        const totalItemKg = item.quantity * itemKg
        orderWeightKg += totalItemKg

        // تفکیک برند
        if (item.product?.brand) {
          const bId = item.product.brand.id
          const bName = item.product.brand.nameFa
          const curBrand = brandMap.get(bId) || { brandNameFa: bName, revenueToman: 0, weightTon: 0 }
          curBrand.revenueToman += Number(item.totalPrice)
          curBrand.weightTon += totalItemKg / 1000
          brandMap.set(bId, curBrand)
        }
      }

      const orderWeightTon = orderWeightKg / 1000
      if (curDaily) {
        curDaily.revenueToman += orderRev
        curDaily.weightTon += orderWeightTon
      }

      // تفکیک استان
      const prov = ord.shippingProvince?.trim() || "نامشخص"
      const curProv = provinceMap.get(prov) || { revenueToman: 0, orderCount: 0 }
      curProv.revenueToman += orderRev
      curProv.orderCount += 1
      provinceMap.set(prov, curProv)
    }

    const daily: DailyStat[] = allDateKeys.map((dk) => {
      const val = dailyMap.get(dk) || { revenueToman: 0, weightTon: 0 }
      return {
        dateKey: dk,
        revenueToman: Math.round(val.revenueToman),
        weightTon: Math.round(val.weightTon * 10) / 10,
      }
    })

    const byBrand: BrandStat[] = Array.from(brandMap.entries())
      .map(([brandId, data]) => ({
        brandId,
        brandNameFa: data.brandNameFa,
        revenueToman: Math.round(data.revenueToman),
        weightTon: Math.round(data.weightTon * 10) / 10,
      }))
      .sort((a, b) => b.revenueToman - a.revenueToman)
      .slice(0, 10)

    const byProvince: ProvinceStat[] = Array.from(provinceMap.entries())
      .map(([province, data]) => ({
        province,
        revenueToman: Math.round(data.revenueToman),
        orderCount: data.orderCount,
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 8)

    const conversionRate = quotesTotal > 0 ? quotesConverted / quotesTotal : 0

    return {
      daily,
      byBrand,
      byProvince,
      conversion: {
        quotesTotal,
        quotesConverted,
        rate: Math.min(1, Math.max(0, conversionRate)),
      },
    }
  } catch (err) {
    console.error("[getSalesStats] DB error:", err)
    return {
      daily: [],
      byBrand: [],
      byProvince: [],
      conversion: {
        quotesTotal: 0,
        quotesConverted: 0,
        rate: 0,
      },
    }
  }
})
