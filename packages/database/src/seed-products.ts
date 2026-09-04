import {
  PrismaClient,
  CementType,
  CementGrade,
  PackagingType,
  StockStatus,
} from "@prisma/client"

const db = new PrismaClient()

async function main() {
  console.log("🌱 Seeding real products and brands from tirajeconcrete.com…")

  // 1. Ensure cement category exists
  const cementCategory = await db.category.upsert({
    where: { slug: "cement" },
    update: {
      nameFa: "سیمان",
      nameEn: "Cement",
      isActive: true,
      sortOrder: 1,
    },
    create: {
      nameFa: "سیمان",
      nameEn: "Cement",
      slug: "cement",
      isActive: true,
      sortOrder: 1,
    },
  })
  console.log("✅ Cement category confirmed:", cementCategory.slug)

  // 2. Upsert 5 Brands
  const brandsData = [
    {
      slug: "shargh",
      nameFa: "سیمان شرق",
      nameEn: "Shargh Cement",
      logoUrl: "https://tirajeconcrete.com/images/BrandImages/1.jpg",
      description: "شرکت سیمان شرق مشهد، یکی از بزرگترین تولیدکنندگان سیمان در شمال شرق کشور",
      sortOrder: 1,
    },
    {
      slug: "mazandaran",
      nameFa: "سیمان مازندران",
      nameEn: "Mazandaran Cement",
      logoUrl: "https://tirajeconcrete.com/images/BrandImages/2.jpg",
      description: "شرکت سیمان مازندران، پیشرو در تولید سیمان‌های پرتلند باکیفیت در شمال کشور",
      sortOrder: 2,
    },
    {
      slug: "shomal",
      nameFa: "سیمان شمال",
      nameEn: "Shomal Cement",
      logoUrl: "https://tirajeconcrete.com/images/BrandImages/3.jpg",
      description: "شرکت سیمان شمال، تولیدکننده سیمان‌های خاکستری و سفید در ایران",
      sortOrder: 3,
    },
    {
      slug: "bojnourd",
      nameFa: "سیمان بجنورد",
      nameEn: "Bojnourd Cement",
      logoUrl: "https://tirajeconcrete.com/images/BrandImages/5.jpg",
      description: "شرکت سیمان بجنورد، تولیدکننده انواع سیمان پرتلند تیپ ۱ و ۲ در خراسان شمالی",
      sortOrder: 4,
    },
    {
      slug: "zaveh",
      nameFa: "سیمان زاوه تربت",
      nameEn: "Zaveh Torbat Cement",
      logoUrl: "https://tirajeconcrete.com/images/BrandImages/4.jpg",
      description: "شرکت سیمان زاوه تربت، تولیدکننده سیمان استاندارد و باکیفیت در خراسان رضوی",
      sortOrder: 5,
    },
  ]

  const brandMap = new Map<string, string>()

  for (const b of brandsData) {
    const brand = await db.brand.upsert({
      where: { slug: b.slug },
      update: {
        nameFa: b.nameFa,
        nameEn: b.nameEn,
        logoUrl: b.logoUrl,
        description: b.description,
        sortOrder: b.sortOrder,
        isActive: true,
      },
      create: {
        nameFa: b.nameFa,
        nameEn: b.nameEn,
        slug: b.slug,
        logoUrl: b.logoUrl,
        description: b.description,
        sortOrder: b.sortOrder,
        isActive: true,
      },
    })
    brandMap.set(b.slug, brand.id)
    console.log(`✅ Brand upserted: ${b.nameFa} (${b.slug})`)
  }

  // 3. Upsert 14 Products from tirajeconcrete.com
  const productsData = [
    // ─── Bojnourd ────────────────────────────────────────────────────────────
    {
      slug: "bojnourd-cement-type1-32-5",
      nameFa: "سیمان پرتلند نوع ۱ رده ۳۲.۵ بجنورد",
      nameEn: "Bojnourd Portland Cement Type 1 - 32.5",
      brandSlug: "bojnourd",
      cementType: CementType.TYPE_1_325,
      cementGrade: CementGrade.GRADE_325,
      packagingType: PackagingType.BAG_50KG,
      weightKg: 50,
      price: 870000,
      comparePrice: 920000,
      stockQty: 400,
      descriptionFa: "سیمان پرتلند نوع ۱ رده مقاومتی ۳۲.۵ بجنورد، مناسب برای مصارف عمومی ساختمانی، بتن‌های غیرمسلح و ساخت ملات.",
      descriptionEn: "Bojnourd Portland cement type 1 grade 32.5 for general masonry and reinforced construction.",
      imageUrl: "https://tirajeconcrete.com/images/ProductThumbImages/IMG_20260519_184131.jpg",
    },
    {
      slug: "bojnourd-cement-type2-42-5",
      nameFa: "سیمان پرتلند نوع ۲ رده ۴۲.۵ بجنورد",
      nameEn: "Bojnourd Cement Type 2 - 42.5",
      brandSlug: "bojnourd",
      cementType: CementType.TYPE_2,
      cementGrade: CementGrade.GRADE_425,
      packagingType: PackagingType.BAG_50KG,
      weightKg: 50,
      price: 890000,
      comparePrice: 950000,
      stockQty: 350,
      descriptionFa: "سیمان پرتلند نوع ۲ رده مقاومتی ۴۲.۵ بجنورد با مقاومت متوسط در برابر سولفات‌ها برای سازه‌ها و پی‌ریزی‌ها.",
      descriptionEn: "Bojnourd Portland cement type 2 grade 42.5 with moderate sulfate resistance.",
      imageUrl: "https://tirajeconcrete.com/images/ProductThumbImages/IMG_1617.jpg",
    },

    // ─── Zaveh ───────────────────────────────────────────────────────────────
    {
      slug: "zaveh-cement-type2-32-5",
      nameFa: "سیمان پرتلند نوع ۲ رده ۳۲.۵ زاوه تربت",
      nameEn: "Zaveh Cement Type 2 - 32.5",
      brandSlug: "zaveh",
      cementType: CementType.TYPE_2,
      cementGrade: CementGrade.GRADE_325,
      packagingType: PackagingType.BAG_50KG,
      weightKg: 50,
      price: 860000,
      comparePrice: 910000,
      stockQty: 500,
      descriptionFa: "سیمان نوع ۲ زاوه تربت حیدریه با کیفیت استاندارد برای فونداسیون، کانال‌ها و بتن‌ریزی عمومی.",
      descriptionEn: "Zaveh Portland cement type 2 grade 32.5 for general foundations and civil structures.",
      imageUrl: "https://tirajeconcrete.com/images/ProductThumbImages/سیمان-زاوه-تربت -2.jpg",
    },
    {
      slug: "zaveh-cement-type2-42-5",
      nameFa: "سیمان پرتلند نوع ۲ رده ۴۲.۵ زاوه تربت",
      nameEn: "Zaveh Cement Type 2 - 42.5",
      brandSlug: "zaveh",
      cementType: CementType.TYPE_2,
      cementGrade: CementGrade.GRADE_425,
      packagingType: PackagingType.BAG_50KG,
      weightKg: 50,
      price: 880000,
      comparePrice: 940000,
      stockQty: 450,
      descriptionFa: "سیمان پرتلند نوع ۲ رده مقاومتی ۴۲.۵ کارخانه زاوه با مقاومت فشاری بالا و گیرش مناسب.",
      descriptionEn: "Zaveh Portland cement type 2 grade 42.5 with high compressive strength.",
      imageUrl: "https://tirajeconcrete.com/images/ProductThumbImages/سیمان-زاوه-تربت.jpg",
    },

    // ─── Shomal ──────────────────────────────────────────────────────────────
    {
      slug: "shomal-cement-type2-32-5",
      nameFa: "سیمان پرتلند نوع ۲ رده ۳۲.۵ شمال",
      nameEn: "Shumal Portland Cement Type 1 - 32.5",
      brandSlug: "shomal",
      cementType: CementType.TYPE_2,
      cementGrade: CementGrade.GRADE_325,
      packagingType: PackagingType.BAG_50KG,
      weightKg: 50,
      price: 885000,
      comparePrice: 935000,
      stockQty: 300,
      descriptionFa: "سیمان نوع ۲ سیمان شمال تولید شده مطابق با آخرین استانداردهای ملی با مقاومت در برابر محیط‌های مرطوب.",
      descriptionEn: "Shomal Portland cement type 2 grade 32.5 for humid environments and standard construction.",
      imageUrl: "https://tirajeconcrete.com/images/ProductThumbImages/سیمان-شمال.jpg",
    },

    // ─── Mazandaran ──────────────────────────────────────────────────────────
    {
      slug: "mazandaran-cement-type2-42-5",
      nameFa: "سیمان پرتلند نوع ۲ رده ۴۲.۵ مازندران",
      nameEn: "Mazandaran Portland Cement Type 1 - 42.5",
      brandSlug: "mazandaran",
      cementType: CementType.TYPE_2,
      cementGrade: CementGrade.GRADE_425,
      packagingType: PackagingType.BAG_50KG,
      weightKg: 50,
      price: 895000,
      comparePrice: 960000,
      stockQty: 380,
      descriptionFa: "سیمان پرتلند نوع ۲ رده ۴۲.۵ مازندران، یکی از محبوب‌ترین سیمان‌ها در پروژه‌های عمرانی شمال کشور.",
      descriptionEn: "Mazandaran Portland cement type 2 grade 42.5 widely used in northern Iran civil works.",
      imageUrl: "https://tirajeconcrete.com/images/ProductThumbImages/سیمان-مازندران.jpg",
    },
    {
      slug: "mazandaran-cement-type1-32-5",
      nameFa: "سیمان پرتلند نوع ۱ رده ۳۲.۵ مازندران",
      nameEn: "Mazandaran Portland Cement Type 1 - 32.5",
      brandSlug: "mazandaran",
      cementType: CementType.TYPE_1_325,
      cementGrade: CementGrade.GRADE_325,
      packagingType: PackagingType.BAG_50KG,
      weightKg: 50,
      price: 865000,
      comparePrice: 915000,
      stockQty: 400,
      descriptionFa: "سیمان پرتلند معمولی نوع ۱ رده ۳۲.۵ مازندران جهت کلیه کارهای ساختمانی و ملات‌کاری.",
      descriptionEn: "Mazandaran Portland cement type 1 grade 32.5 for all regular masonry and concrete work.",
      imageUrl: "https://tirajeconcrete.com/images/ProductThumbImages/MazandaranCement42-5.jpg",
    },

    // ─── Shargh ──────────────────────────────────────────────────────────────
    {
      slug: "shargh-cement-m500",
      nameFa: "سیمان M500 آنتی سولفات شرق",
      nameEn: "Cement M500 Anti Sulfate Shargh",
      brandSlug: "shargh",
      cementType: CementType.TYPE_5,
      cementGrade: CementGrade.GRADE_525,
      packagingType: PackagingType.BAG_50KG,
      weightKg: 50,
      price: 960000,
      comparePrice: 1050000,
      stockQty: 250,
      descriptionFa: "سیمان ضد سولفات با مقاومت بسیار بالای M500 تولید شرکت سیمان شرق برای سازه‌های دریایی و فاضلابی.",
      descriptionEn: "Shargh high-strength M500 anti-sulfate cement for marine and sewage structures.",
      imageUrl: "https://tirajeconcrete.com/images/ProductThumbImages/1745838962.jpg",
    },
    {
      slug: "shargh-cement-type5-42-5",
      nameFa: "سیمان پرتلند نوع ۵ رده مقاومتی ۴۲.۵ شرق",
      nameEn: "Portland Cement Type 5 - 42.5 Shargh",
      brandSlug: "shargh",
      cementType: CementType.TYPE_5,
      cementGrade: CementGrade.GRADE_425,
      packagingType: PackagingType.BAG_50KG,
      weightKg: 50,
      price: 940000,
      comparePrice: 1000000,
      stockQty: 320,
      descriptionFa: "سیمان پرتلند نوع ۵ شرق ضد سولفات برای فونداسیون‌های در تماس با آب‌های زیرزمینی و خاک‌های سولفاته.",
      descriptionEn: "Shargh Portland cement type 5 grade 42.5 sulfate-resistant for underground structures.",
      imageUrl: "https://tirajeconcrete.com/images/ProductThumbImages/1745834891.jpg",
    },
    {
      slug: "shargh-cement-export-type1",
      nameFa: "سیمان صادراتی شرق",
      nameEn: "Export Cement Type 1 - 42.5 Shargh",
      brandSlug: "shargh",
      cementType: CementType.TYPE_1_425,
      cementGrade: CementGrade.GRADE_425,
      packagingType: PackagingType.BAG_50KG,
      weightKg: 50,
      price: 950000,
      comparePrice: 1020000,
      stockQty: 500,
      descriptionFa: "سیمان پرتلند صادراتی شرق با بسته‌بندی مقاوم و مقاومت مکانیکی برتر مطابق استانداردهای بین‌المللی.",
      descriptionEn: "Shargh export quality Portland cement type 1 grade 42.5 with durable packaging.",
      imageUrl: "https://tirajeconcrete.com/images/ProductThumbImages/1745838401.jpg",
    },
    {
      slug: "shargh-cement-oil-well",
      nameFa: "سیمان حفاری چاه نفت شرق",
      nameEn: "Oil Well Cement Shargh",
      brandSlug: "shargh",
      cementType: CementType.OIL_WELL,
      cementGrade: CementGrade.GRADE_525,
      packagingType: PackagingType.BAG_50KG,
      weightKg: 50,
      price: 1250000,
      comparePrice: 1400000,
      stockQty: 150,
      descriptionFa: "سیمان ویژه حفاری چاه‌های نفت و گاز تولید شرکت سیمان شرق با تاییدیه وزارت نفت و انطباق با استاندارد API.",
      descriptionEn: "Shargh specialized oil well drilling cement conforming to API specifications.",
      imageUrl: "https://tirajeconcrete.com/images/ProductThumbImages/1745834699.jpg",
    },
    {
      slug: "shargh-cement-type2-42-5",
      nameFa: "سیمان پرتلند نوع ۲ رده مقاومتی ۴۲.۵ شرق",
      nameEn: "Portland Cement Type 2 - 42.5 Shargh",
      brandSlug: "shargh",
      cementType: CementType.TYPE_2,
      cementGrade: CementGrade.GRADE_425,
      packagingType: PackagingType.BAG_50KG,
      weightKg: 50,
      price: 890000,
      comparePrice: 950000,
      stockQty: 450,
      descriptionFa: "سیمان پرتلند نوع ۲ رده مقاومتی ۴۲.۵ تولید کارخانجات سیمان شرق با کاربرد در سازه‌های عمومی و بتن‌ریزی‌های حجیم.",
      descriptionEn: "Shargh Portland cement type 2 grade 42.5 for general construction and mass concreting.",
      imageUrl: "https://tirajeconcrete.com/images/ProductThumbImages/1745834782.jpg",
    },
    {
      slug: "shargh-cement-type1-42-5",
      nameFa: "سیمان پرتلند نوع ۱ رده مقاومتی ۴۲.۵ شرق",
      nameEn: "Portland Cement Type 1 - 42.5 Shargh",
      brandSlug: "shargh",
      cementType: CementType.TYPE_1_425,
      cementGrade: CementGrade.GRADE_425,
      packagingType: PackagingType.BAG_50KG,
      weightKg: 50,
      price: 860000,
      comparePrice: 920000,
      stockQty: 400,
      descriptionFa: "سیمان پرتلند نوع ۱ رده ۴۲.۵ شرق با مقاومت اولیه و نهایی عالی برای بتن‌های سازه‌ای و تیر و ستون.",
      descriptionEn: "Shargh Portland cement type 1 grade 42.5 with superior structural performance.",
      imageUrl: "https://tirajeconcrete.com/images/ProductThumbImages/1745834764.jpg",
    },
    {
      slug: "shargh-cement-composite",
      nameFa: "سیمان مرکب شرق",
      nameEn: "Composite Cement Shargh",
      brandSlug: "shargh",
      cementType: CementType.COMPOSITE,
      cementGrade: CementGrade.GRADE_325,
      packagingType: PackagingType.BAG_50KG,
      weightKg: 50,
      price: 830000,
      comparePrice: 890000,
      stockQty: 350,
      descriptionFa: "سیمان مرکب شرق با حرارت هیدراتاسیون پایین، کارایی فوق‌العاده در ملات‌ها و کاهش نفوذپذیری بتن.",
      descriptionEn: "Shargh composite cement with low hydration heat and excellent workability.",
      imageUrl: "https://tirajeconcrete.com/images/ProductThumbImages/1745834736.jpg",
    },
  ]

  for (const p of productsData) {
    const brandId = brandMap.get(p.brandSlug)
    if (!brandId) {
      throw new Error(`Brand not found: ${p.brandSlug}`)
    }

    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {
        nameFa: p.nameFa,
        nameEn: p.nameEn,
        brandId,
        cementType: p.cementType,
        cementGrade: p.cementGrade,
        packagingType: p.packagingType,
        weightKg: p.weightKg,
        price: p.price,
        comparePrice: p.comparePrice,
        stockStatus: StockStatus.IN_STOCK,
        stockQty: p.stockQty,
        minOrderQty: 10,
        descriptionFa: p.descriptionFa,
        descriptionEn: p.descriptionEn,
        isActive: true,
      },
      create: {
        nameFa: p.nameFa,
        nameEn: p.nameEn,
        slug: p.slug,
        brandId,
        cementType: p.cementType,
        cementGrade: p.cementGrade,
        packagingType: p.packagingType,
        weightKg: p.weightKg,
        price: p.price,
        comparePrice: p.comparePrice,
        stockStatus: StockStatus.IN_STOCK,
        stockQty: p.stockQty,
        minOrderQty: 10,
        descriptionFa: p.descriptionFa,
        descriptionEn: p.descriptionEn,
        isActive: true,
      },
    })

    // Link product to category
    await db.productCategory.upsert({
      where: {
        productId_categoryId: {
          productId: product.id,
          categoryId: cementCategory.id,
        },
      },
      update: {},
      create: {
        productId: product.id,
        categoryId: cementCategory.id,
      },
    })

    // Upsert primary image
    const existingImg = await db.productImage.findFirst({
      where: { productId: product.id },
    })

    if (existingImg) {
      await db.productImage.update({
        where: { id: existingImg.id },
        data: {
          url: p.imageUrl,
          altFa: p.nameFa,
          altEn: p.nameEn,
          isPrimary: true,
        },
      })
    } else {
      await db.productImage.create({
        data: {
          productId: product.id,
          url: p.imageUrl,
          altFa: p.nameFa,
          altEn: p.nameEn,
          sortOrder: 0,
          isPrimary: true,
        },
      })
    }

    console.log(`✅ Product seeded: ${p.nameFa} (${p.slug})`)
  }

  console.log("🎉 Successfully seeded 14 products and 5 brands!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
