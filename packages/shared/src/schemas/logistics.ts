import { z } from "zod"

export const FreightQuerySchema = z.object({
  province: z.string().min(2, "استان الزامی"),
  city: z.string().min(2, "شهر الزامی"),
  totalWeightTon: z.coerce.number().min(0.5, "حداقل ۰.۵ تن").max(26, "حداکثر ۲۶ تن"),
})

export const UpdateShipmentSchema = z.object({
  shipmentId: z.string().uuid(),
  status: z.enum([
    "PENDING",
    "ASSIGNED",
    "LOADING",
    "IN_TRANSIT",
    "DELIVERED",
    "FAILED",
  ]),
  trackingCode: z.string().max(100).optional(),
  driverName: z.string().max(100).optional(),
  driverPhone: z.string().regex(/^09[0-9]{9}$/).optional(),
  truckPlate: z.string().max(20).optional(),
  note: z.string().max(500).optional(),
  estimatedDelivery: z.coerce.date().optional(),
  actualDelivery: z.coerce.date().optional(),
})

export const CreateShippingZoneSchema = z.object({
  name: z.string().min(2).max(100),
  provinces: z.array(z.string()).min(1, "حداقل یک استان الزامی"),
  isActive: z.boolean().default(true),
})

export const CreateShippingRateSchema = z.object({
  zoneId: z.string().uuid(),
  truckType: z.enum(["PICKUP", "MINI_TRUCK", "TRUCK_6_TON", "TRUCK_10_TON", "TRUCK_20_TON", "SEMI_TRAILER"]),
  capacityTon: z.coerce.number().min(0.5),
  minLoadTon: z.coerce.number().min(0),
  baseCost: z.coerce.number().min(0),
  costPerTon: z.coerce.number().min(0),
  estimatedDaysMin: z.coerce.number().min(1),
  estimatedDaysMax: z.coerce.number().min(1),
  isActive: z.boolean().default(true),
})

export type FreightQueryInput = z.infer<typeof FreightQuerySchema>
export type UpdateShipmentInput = z.infer<typeof UpdateShipmentSchema>
export type CreateShippingZoneInput = z.infer<typeof CreateShippingZoneSchema>
export type CreateShippingRateInput = z.infer<typeof CreateShippingRateSchema>
