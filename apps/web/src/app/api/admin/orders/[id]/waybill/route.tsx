import { NextRequest } from "next/server"
import { renderToStream } from "@react-pdf/renderer"
import { db } from "@tirajeh/database"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { getSiteSettings } from "@/lib/settings"
import { WaybillDocument } from "@/components/pdf/WaybillDocument"

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
      user: true,
      items: {
        include: { product: { select: { nameFa: true, nameEn: true } } },
      },
      shipments: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!order) {
    return new Response("Not Found", { status: 404 })
  }

  const settings = await getSiteSettings()
  const latestShipment = order.shipments[0] ?? null

  const formattedOrder = {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    shippingProvince: order.shippingProvince,
    shippingTruckType: order.shippingTruckType ? String(order.shippingTruckType) : null,
    totalAmount: Number(order.totalAmount),
    items: order.items.map((item) => ({
      productNameFa: item.productNameFa || item.product?.nameFa || "محصول سیمان",
      quantity: item.quantity,
      weightKg: item.weightKg ? Number(item.weightKg) : null,
    })),
    user: {
      name: order.user?.name ?? null,
      phone: order.user?.phone ?? null,
    },
    shipment: latestShipment
      ? {
          truckPlate: latestShipment.truckPlate,
          driverName: latestShipment.driverName,
          driverPhone: latestShipment.driverPhone,
          trackingNote: latestShipment.trackingNote,
        }
      : null,
  }

  const company = {
    name: settings.siteNameFa || "شرکت بازرگانی تیراژه بتن",
    phone: settings.supportPhone || "۰۲۱-۸۸۸۸۸۸۸۸",
    address: settings.addressFa || "تهران",
  }

  const stream = await renderToStream(
    <WaybillDocument order={formattedOrder} company={company} />
  )

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="waybill-${order.orderNumber}.pdf"`,
    },
  })
}
