import {
  PrismaClient,
  CustomerType,
  CementType,
  CementGrade,
  PackagingType,
  StockStatus,
} from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

export async function seedRolesAndPermissions(db: PrismaClient) {
  const rolesData = [
    {
      name: "super_admin",
      displayName: "مدیر ارشد",
      description: "دسترسی کامل به تمام بخش‌های سیستم",
      isSystem: true,
    },
    {
      name: "admin",
      displayName: "مدیر سیستم",
      description: "دسترسی کامل مدیریت سیستم",
      isSystem: true,
    },
    {
      name: "operator",
      displayName: "اپراتور",
      description: "مدیریت محصولات، سفارش‌ها و قیمت‌ها",
      isSystem: true,
    },
    {
      name: "support",
      displayName: "پشتیبان",
      description: "پشتیبانی تیکت‌ها و سفارش‌ها",
      isSystem: true,
    },
    {
      name: "customer",
      displayName: "مشتری",
      description: "کاربر عادی سامانه",
      isSystem: true,
    },
  ]

  const rolesMap = new Map<string, Awaited<ReturnType<typeof db.role.upsert>>>()
  for (const r of rolesData) {
    const role = await db.role.upsert({
      where: { name: r.name },
      update: {
        displayName: r.displayName,
        description: r.description,
      },
      create: r,
    })
    rolesMap.set(r.name, role)
  }

  const permissionsData = [
    // Standard system permissions
    { resource: "products", action: "create" },
    { resource: "products", action: "update" },
    { resource: "products", action: "delete" },
    { resource: "orders", action: "read" },
    { resource: "orders", action: "update" },
    { resource: "users", action: "read" },
    { resource: "users", action: "update" },
    { resource: "blog", action: "*" },
    { resource: "prices", action: "publish" },
    { resource: "tickets", action: "reply" },
    { resource: "quotes", action: "update" },
    { resource: "categories", action: "*" },
    { resource: "brands", action: "*" },
    { resource: "shipping", action: "manage" },
    { resource: "factories", action: "manage" },
    { resource: "settings", action: "manage" },

    // Legacy permissions
    { resource: "product", action: "read" },
    { resource: "product", action: "create" },
    { resource: "product", action: "update" },
    { resource: "product", action: "delete" },
    { resource: "order", action: "read" },
    { resource: "order", action: "update" },
    { resource: "order", action: "cancel" },
    { resource: "user", action: "read" },
    { resource: "user", action: "create" },
    { resource: "user", action: "update" },
    { resource: "user", action: "delete" },
    { resource: "post", action: "read" },
    { resource: "post", action: "create" },
    { resource: "post", action: "update" },
    { resource: "post", action: "delete" },
    { resource: "post", action: "publish" },
    { resource: "quote", action: "read" },
    { resource: "quote", action: "respond" },
    { resource: "contact", action: "read" },
    { resource: "contact", action: "respond" },
    { resource: "shipment", action: "read" },
    { resource: "shipment", action: "update" },
    { resource: "setting", action: "read" },
    { resource: "setting", action: "update" },
    { resource: "audit", action: "read" },
    { resource: "dashboard", action: "read" },
  ]

  const operatorPerms = [
    "products:create", "products:update", "products:delete",
    "orders:read", "orders:update",
    "prices:publish",
    "categories:*", "brands:*",
    "product:read", "product:create", "product:update",
    "order:read", "order:update",
  ]

  const supportPerms = [
    "tickets:reply", "orders:read", "users:read", "quotes:update",
    "contact:read", "contact:respond", "quote:read", "order:read",
  ]

  for (const p of permissionsData) {
    const perm = await db.permission.upsert({
      where: { resource_action: { resource: p.resource, action: p.action } },
      update: {},
      create: p,
    })

    const permKey = `${p.resource}:${p.action}`
    const targetRoles: string[] = ["super_admin", "admin"]
    if (operatorPerms.includes(permKey)) targetRoles.push("operator")
    if (supportPerms.includes(permKey)) targetRoles.push("support")

    for (const roleName of targetRoles) {
      const role = rolesMap.get(roleName)
      if (!role) continue
      await db.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: perm.id,
        },
      })
    }
  }

  console.log("✅ Roles and permissions seeded")
  return rolesMap
}

async function main() {
  console.log("🌱 Seeding database…")

  // ─── 1. Roles & Permissions ────────────────────────────────────────────────
  const rolesMap = await seedRolesAndPermissions(db)
  const adminRole = rolesMap.get("admin")!

  // ─── 2. Admin User ─────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin1234!", 12)
  await db.user.upsert({
    where: { email: "admin@tirajeh.ir" },
    update: {
      name: "مدیر سیستم",
      passwordHash: adminPassword,
      roleId: adminRole.id,
      isActive: true,
    },
    create: {
      name: "مدیر سیستم",
      email: "admin@tirajeh.ir",
      passwordHash: adminPassword,
      roleId: adminRole.id,
      customerType: CustomerType.COMPANY,
      isActive: true,
    },
  })
  console.log("✅ Admin user seeded (admin@tirajeh.ir)")

  // ─── 3. Categories ─────────────────────────────────────────────────────────
  const cement = await db.category.upsert({
    where: { slug: "cement" },
    update: {
      nameFa: "سیمان",
      nameEn: "Cement",
      sortOrder: 1,
      isActive: true,
    },
    create: {
      nameFa: "سیمان",
      nameEn: "Cement",
      slug: "cement",
      sortOrder: 1,
      isActive: true,
    },
  })

  const aggregate = await db.category.upsert({
    where: { slug: "aggregate" },
    update: {
      nameFa: "شن و ماسه",
      nameEn: "Aggregate",
      sortOrder: 2,
      isActive: true,
    },
    create: {
      nameFa: "شن و ماسه",
      nameEn: "Aggregate",
      slug: "aggregate",
      sortOrder: 2,
      isActive: true,
    },
  })

  await db.category.upsert({
    where: { slug: "ready-mix-concrete" },
    update: {
      nameFa: "بتن آماده",
      nameEn: "Ready-Mix Concrete",
      sortOrder: 3,
      isActive: true,
    },
    create: {
      nameFa: "بتن آماده",
      nameEn: "Ready-Mix Concrete",
      slug: "ready-mix-concrete",
      sortOrder: 3,
      isActive: true,
    },
  })

  await db.category.upsert({
    where: { slug: "concrete-additives" },
    update: {
      nameFa: "افزودنی‌های بتن",
      nameEn: "Concrete Additives",
      sortOrder: 4,
      isActive: true,
    },
    create: {
      nameFa: "افزودنی‌های بتن",
      nameEn: "Concrete Additives",
      slug: "concrete-additives",
      sortOrder: 4,
      isActive: true,
    },
  })
  console.log("✅ Categories seeded")

  // ─── 4. Brands ─────────────────────────────────────────────────────────────
  const sepahanBrand = await db.brand.upsert({
    where: { slug: "sepahan" },
    update: {
      nameFa: "سیمان سپاهان",
      nameEn: "Sepahan Cement",
      description: "شرکت سیمان سپاهان (اصفهان)",
      isActive: true,
      sortOrder: 1,
    },
    create: {
      nameFa: "سیمان سپاهان",
      nameEn: "Sepahan Cement",
      slug: "sepahan",
      description: "شرکت سیمان سپاهان (اصفهان)",
      isActive: true,
      sortOrder: 1,
    },
  })

  const tirajehBrand = await db.brand.upsert({
    where: { slug: "tirajeh" },
    update: {
      nameFa: "تیراژه بتن",
      nameEn: "Tirajeh",
      description: "محصولات و مصالح تولیدی تیراژه",
      isActive: true,
      sortOrder: 2,
    },
    create: {
      nameFa: "تیراژه بتن",
      nameEn: "Tirajeh",
      slug: "tirajeh",
      description: "محصولات و مصالح تولیدی تیراژه",
      isActive: true,
      sortOrder: 2,
    },
  })

  const abyekBrand = await db.brand.upsert({
    where: { slug: "abyek" },
    update: {
      nameFa: "سیمان آبیک",
      nameEn: "Abyek Cement",
      description: "شرکت سیمان آبیک",
      isActive: true,
      sortOrder: 3,
    },
    create: {
      nameFa: "سیمان آبیک",
      nameEn: "Abyek Cement",
      slug: "abyek",
      description: "شرکت سیمان آبیک",
      isActive: true,
      sortOrder: 3,
    },
  })
  console.log("✅ Brands seeded")

  // ─── 5. Factories ──────────────────────────────────────────────────────────
  let factorySepahan = await db.factory.findFirst({
    where: { nameFa: "کارخانه سیمان سپاهان — اصفهان" },
  })
  if (!factorySepahan) {
    factorySepahan = await db.factory.create({
      data: {
        nameFa: "کارخانه سیمان سپاهان — اصفهان",
        nameEn: "Sepahan Cement Plant - Isfahan",
        city: "اصفهان",
        province: "اصفهان",
        latitude: 32.6546,
        longitude: 51.6679,
        isActive: true,
      },
    })
  }

  let factoryTehran = await db.factory.findFirst({
    where: { nameFa: "کارخانه تیراژه — تهران" },
  })
  if (!factoryTehran) {
    factoryTehran = await db.factory.create({
      data: {
        nameFa: "کارخانه تیراژه — تهران",
        nameEn: "Tirajeh Plant - Tehran",
        city: "تهران",
        province: "تهران",
        latitude: 35.6892,
        longitude: 51.389,
        isActive: true,
      },
    })
  }
  console.log("✅ Factories seeded")

  // ─── 6. Products ───────────────────────────────────────────────────────────
  // Product 1: سیمان پرتلند تیپ ۱ — ۵۰ کیلوگرمی
  const product1 = await db.product.upsert({
    where: { slug: "cement-type1-50kg" },
    update: {
      nameFa: "سیمان پرتلند تیپ ۱ — ۵۰ کیلوگرمی",
      nameEn: "Portland Cement Type 1 — 50kg",
      descriptionFa: "سیمان پرتلند تیپ ۱ مناسب برای کارهای عمومی ساختمانی، بتن‌ریزی مسلح و غیرمسلح",
      descriptionEn: "Portland Cement Type 1 suitable for general construction",
      price: 850000,
      comparePrice: 920000,
      packagingType: PackagingType.BAG_50KG,
      cementType: CementType.TYPE_1_425,
      cementGrade: CementGrade.GRADE_425,
      weightKg: 50,
      stockStatus: StockStatus.IN_STOCK,
      stockQty: 500,
      minOrderQty: 10,
      brandId: sepahanBrand.id,
      factoryId: factorySepahan.id,
      isActive: true,
      isFeatured: true,
    },
    create: {
      nameFa: "سیمان پرتلند تیپ ۱ — ۵۰ کیلوگرمی",
      nameEn: "Portland Cement Type 1 — 50kg",
      slug: "cement-type1-50kg",
      descriptionFa: "سیمان پرتلند تیپ ۱ مناسب برای کارهای عمومی ساختمانی، بتن‌ریزی مسلح و غیرمسلح",
      descriptionEn: "Portland Cement Type 1 suitable for general construction",
      price: 850000,
      comparePrice: 920000,
      packagingType: PackagingType.BAG_50KG,
      cementType: CementType.TYPE_1_425,
      cementGrade: CementGrade.GRADE_425,
      weightKg: 50,
      stockStatus: StockStatus.IN_STOCK,
      stockQty: 500,
      minOrderQty: 10,
      brandId: sepahanBrand.id,
      factoryId: factorySepahan.id,
      isActive: true,
      isFeatured: true,
    },
  })

  await db.productCategory.upsert({
    where: {
      productId_categoryId: {
        productId: product1.id,
        categoryId: cement.id,
      },
    },
    update: {},
    create: {
      productId: product1.id,
      categoryId: cement.id,
    },
  })

  // Product 2: ماسه شسته — یک تن
  const product2 = await db.product.upsert({
    where: { slug: "sand-washed-1ton" },
    update: {
      nameFa: "ماسه شسته — یک تن",
      nameEn: "Washed Sand — 1 Ton",
      descriptionFa: "ماسه شسته مناسب برای بتن‌ریزی و اندودکاری",
      descriptionEn: "Washed sand suitable for concrete and rendering",
      price: 1200000,
      comparePrice: 1350000,
      packagingType: PackagingType.BULK,
      weightKg: 1000,
      stockStatus: StockStatus.IN_STOCK,
      stockQty: 200,
      minOrderQty: 1,
      brandId: tirajehBrand.id,
      factoryId: factoryTehran.id,
      isActive: true,
      isFeatured: true,
    },
    create: {
      nameFa: "ماسه شسته — یک تن",
      nameEn: "Washed Sand — 1 Ton",
      slug: "sand-washed-1ton",
      descriptionFa: "ماسه شسته مناسب برای بتن‌ریزی و اندودکاری",
      descriptionEn: "Washed sand suitable for concrete and rendering",
      price: 1200000,
      comparePrice: 1350000,
      packagingType: PackagingType.BULK,
      weightKg: 1000,
      stockStatus: StockStatus.IN_STOCK,
      stockQty: 200,
      minOrderQty: 1,
      brandId: tirajehBrand.id,
      factoryId: factoryTehran.id,
      isActive: true,
      isFeatured: true,
    },
  })

  await db.productCategory.upsert({
    where: {
      productId_categoryId: {
        productId: product2.id,
        categoryId: aggregate.id,
      },
    },
    update: {},
    create: {
      productId: product2.id,
      categoryId: aggregate.id,
    },
  })

  // Product 3: سیمان پرتلند تیپ ۲ — ۵۰ کیلوگرمی
  const product3 = await db.product.upsert({
    where: { slug: "cement-type2-50kg" },
    update: {
      nameFa: "سیمان پرتلند تیپ ۲ — ۵۰ کیلوگرمی",
      nameEn: "Portland Cement Type 2 — 50kg",
      descriptionFa: "سیمان پرتلند تیپ ۲ با مقاومت متوسط در برابر سولفات‌ها، مناسب برای فونداسیون و بتن‌ریزی حجیم",
      descriptionEn: "Portland Cement Type 2 with moderate sulfate resistance",
      price: 890000,
      comparePrice: 950000,
      packagingType: PackagingType.BAG_50KG,
      cementType: CementType.TYPE_2,
      cementGrade: CementGrade.GRADE_425,
      weightKg: 50,
      stockStatus: StockStatus.IN_STOCK,
      stockQty: 400,
      minOrderQty: 10,
      brandId: abyekBrand.id,
      factoryId: factoryTehran.id,
      isActive: true,
      isFeatured: true,
    },
    create: {
      nameFa: "سیمان پرتلند تیپ ۲ — ۵۰ کیلوگرمی",
      nameEn: "Portland Cement Type 2 — 50kg",
      slug: "cement-type2-50kg",
      descriptionFa: "سیمان پرتلند تیپ ۲ با مقاومت متوسط در برابر سولفات‌ها، مناسب برای فونداسیون و بتن‌ریزی حجیم",
      descriptionEn: "Portland Cement Type 2 with moderate sulfate resistance",
      price: 890000,
      comparePrice: 950000,
      packagingType: PackagingType.BAG_50KG,
      cementType: CementType.TYPE_2,
      cementGrade: CementGrade.GRADE_425,
      weightKg: 50,
      stockStatus: StockStatus.IN_STOCK,
      stockQty: 400,
      minOrderQty: 10,
      brandId: abyekBrand.id,
      factoryId: factoryTehran.id,
      isActive: true,
      isFeatured: true,
    },
  })

  await db.productCategory.upsert({
    where: {
      productId_categoryId: {
        productId: product3.id,
        categoryId: cement.id,
      },
    },
    update: {},
    create: {
      productId: product3.id,
      categoryId: cement.id,
    },
  })

  // Product 4: سیمان سفید — ۵۰ کیلوگرمی
  const product4 = await db.product.upsert({
    where: { slug: "white-cement-50kg" },
    update: {
      nameFa: "سیمان سفید — ۵۰ کیلوگرمی",
      nameEn: "White Portland Cement — 50kg",
      descriptionFa: "سیمان سفید با درخشندگی و سفیدی بالا مناسب نماسازی، بندکشی و ملات‌های دکوراتیو",
      descriptionEn: "High-whiteness Portland cement for facade and architectural finishes",
      price: 1450000,
      comparePrice: 1550000,
      packagingType: PackagingType.BAG_50KG,
      cementType: CementType.WHITE,
      cementGrade: CementGrade.GRADE_525,
      weightKg: 50,
      stockStatus: StockStatus.IN_STOCK,
      stockQty: 150,
      minOrderQty: 5,
      brandId: sepahanBrand.id,
      factoryId: factorySepahan.id,
      isActive: true,
      isFeatured: false,
    },
    create: {
      nameFa: "سیمان سفید — ۵۰ کیلوگرمی",
      nameEn: "White Portland Cement — 50kg",
      slug: "white-cement-50kg",
      descriptionFa: "سیمان سفید با درخشندگی و سفیدی بالا مناسب نماسازی، بندکشی و ملات‌های دکوراتیو",
      descriptionEn: "High-whiteness Portland cement for facade and architectural finishes",
      price: 1450000,
      comparePrice: 1550000,
      packagingType: PackagingType.BAG_50KG,
      cementType: CementType.WHITE,
      cementGrade: CementGrade.GRADE_525,
      weightKg: 50,
      stockStatus: StockStatus.IN_STOCK,
      stockQty: 150,
      minOrderQty: 5,
      brandId: sepahanBrand.id,
      factoryId: factorySepahan.id,
      isActive: true,
      isFeatured: false,
    },
  })

  await db.productCategory.upsert({
    where: {
      productId_categoryId: {
        productId: product4.id,
        categoryId: cement.id,
      },
    },
    update: {},
    create: {
      productId: product4.id,
      categoryId: cement.id,
    },
  })

  // Add primary images to products if not existing
  const productsWithImages = [
    { id: product1.id, url: "/images/products/cement-bag-1.jpg", altFa: "سیمان پرتلند تیپ ۱" },
    { id: product2.id, url: "/images/products/sand-1.jpg", altFa: "ماسه شسته ساختمانی" },
    { id: product3.id, url: "/images/products/cement-bag-2.jpg", altFa: "سیمان پرتلند تیپ ۲" },
    { id: product4.id, url: "/images/products/white-cement.jpg", altFa: "سیمان سفید" },
  ]

  for (const item of productsWithImages) {
    const existing = await db.productImage.findFirst({ where: { productId: item.id } })
    if (!existing) {
      await db.productImage.create({
        data: {
          productId: item.id,
          url: item.url,
          altFa: item.altFa,
          isPrimary: true,
          sortOrder: 0,
        },
      })
    }
  }
  console.log("✅ Products seeded")

  // ─── 7. Settings ───────────────────────────────────────────────────────────
  const settings = [
    { key: "site_name", value: "تیراژه بتن" },
    { key: "site_name_en", value: "Tirajeh Concrete" },
    { key: "site_description", value: "فروشگاه آنلاین انواع سیمان و مصالح ساختمانی" },
    { key: "contact_phone", value: "021-88888888" },
    { key: "contact_email", value: "info@tirajeh.ir" },
    { key: "contact_address", value: "تهران، خیابان ولیعصر" },
    { key: "tax_rate_percent", value: 10 },
    { key: "min_order_ton", value: 0.5 },
  ]

  for (const s of settings) {
    await db.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    })
  }
  console.log("✅ Settings seeded")

  console.log("✅ Seed complete")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
