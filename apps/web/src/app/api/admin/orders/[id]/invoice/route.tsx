import { NextRequest } from "next/server"
import { renderToStream } from "@react-pdf/renderer"
import { db } from "@tirajeh/database"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { getSiteSettings } from "@/lib/settings"
import { InvoiceDocument } from "@/components/pdf/InvoiceDocument"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPerm(PERMISSIONS.ORDERS_UPDATE)
  } catch {
    return new Response("Unauthorized", { status: 401 })
  }

  const { id } = await context.params

  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: {
        include: { customerProfile: true },
      },
      items: {
        include: { product: { select: { nameFa: true, nameEn: true } } },
      },
    },
  })

  if (!order) {
    return new Response("Not Found", { status: 404 })
  }

  const settings = await getSiteSettings()

  const formattedOrder = {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    totalAmount: Number(order.totalAmount),
    shippingCost: order.shippingCost ? Number(order.shippingCost) : null,
    shippingProvince: order.shippingProvince,
    shippingAddress: typeof order.shippingAddress === "string" ? order.shippingAddress : null,
    items: order.items.map((item) => ({
      productNameFa: item.productNameFa || item.product?.nameFa || "محصول سیمان",
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      weightKg: item.weightKg ? Number(item.weightKg) : null,
    })),
    user: {
      name: order.user?.name ?? null,
      phone: order.user?.phone ?? null,
      customerProfile: order.user?.customerProfile
        ? {
            companyName: order.user.customerProfile.companyName,
            nationalId: order.user.customerProfile.nationalId,
            economicCode: order.user.customerProfile.economicCode,
            address: order.user.customerProfile.address,
          }
        : null,
    },
  }

  const company = {
    name: settings.siteNameFa || "شرکت بازرگانی تیراژه بتن",
    phone: settings.supportPhone || "۰۲۱-۸۸۸۸۸۸۸۸",
    address: settings.addressFa || "تهران",
    nationalId: settings.nationalId || "",
    economicCode: settings.economicCode || "",
  }

  const stream = await renderToStream(
    <InvoiceDocument order={formattedOrder} company={company} />
  )

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${order.orderNumber}.pdf"`,
    },
  })
}
