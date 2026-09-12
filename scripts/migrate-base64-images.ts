import { db } from "../packages/database/src/client"
import { storageService } from "../packages/integrations/src/storage/service"

async function main() {
  const isDryRun = process.argv.includes("--dry-run")
  console.log(`Starting image migration... ${isDryRun ? "[DRY-RUN]" : ""}`)

  let migrated = 0
  let skipped = 0
  let failed = 0
  const failures: { type: string; id: string; error: any }[] = []

  // 1. Product Images
  const productImages = await db.productImage.findMany({
    where: { url: { startsWith: "data:image/" } }
  })
  
  console.log(`Found ${productImages.length} base64 product images`)

  for (const img of productImages) {
    try {
      const match = img.url.match(/^data:(image\/\w+);base64,(.+)$/)
      if (!match) continue
      
      const [, contentType, base64Part] = match
      const buffer = Buffer.from(base64Part, "base64")
      
      const ext = contentType.split("/")[1]
      const yyyy = new Date().getFullYear()
      const MM = String(new Date().getMonth() + 1).padStart(2, "0")
      const key = `products/${yyyy}/${MM}/${img.id}.${ext}`

      if (isDryRun) {
        skipped++
      } else {
        const publicUrl = await storageService.presignedUploadUrl({
            key,
            mimeType: contentType,
        })
        // storageService.upload is what we actually want!
        const result = await storageService.upload({
          buffer,
          mimeType: contentType,
          originalName: `${img.id}.${ext}`,
          prefix: "products"
        })
        
        await db.productImage.update({
          where: { id: img.id },
          data: { url: result.url }
        })
        migrated++
      }
    } catch (error) {
      console.error(`Failed to migrate product image ${img.id}:`, error)
      failed++
      failures.push({ type: "ProductImage", id: img.id, error })
    }
  }

  // 2. Post Featured Images
  const posts = await db.post.findMany({
    where: { featuredImage: { startsWith: "data:image/" } }
  })
  
  console.log(`Found ${posts.length} base64 post images`)

  for (const post of posts) {
    try {
      const match = post.featuredImage!.match(/^data:(image\/\w+);base64,(.+)$/)
      if (!match) continue
      
      const [, contentType, base64Part] = match
      const buffer = Buffer.from(base64Part, "base64")
      
      const ext = contentType.split("/")[1]
      const yyyy = new Date().getFullYear()
      const MM = String(new Date().getMonth() + 1).padStart(2, "0")
      const key = `blog/${yyyy}/${MM}/${post.id}.${ext}`

      if (isDryRun) {
        skipped++
      } else {
        const result = await storageService.upload({
          buffer,
          mimeType: contentType,
          originalName: `${post.id}.${ext}`,
          prefix: "blog"
        })
        
        await db.post.update({
          where: { id: post.id },
          data: { featuredImage: result.url }
        })
        migrated++
      }
    } catch (error) {
      console.error(`Failed to migrate post image ${post.id}:`, error)
      failed++
      failures.push({ type: "Post", id: post.id, error })
    }
  }

  console.log("\n--- Migration Summary ---")
  console.log(`Migrated: ${migrated} | Failed: ${failed} | Skipped (dry-run): ${skipped}`)
  
  if (failures.length > 0) {
    console.log("\nFailures:")
    console.log(JSON.stringify(failures, null, 2))
  }
}

main().catch(console.error).finally(() => process.exit(0))
