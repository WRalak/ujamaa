import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { withSecurity, fileUploadRateLimit } from '@/middleware/security'

export async function POST(request) {
  return withSecurity(async (req) => {
    try {
      const formData = await request.formData()
      const files = formData.getAll('files')
      
      if (!files || files.length === 0) {
        return NextResponse.json(
          { error: 'No files uploaded' },
          { status: 400 }
        )
      }

      const uploadedFiles = []
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products')
      
      // Ensure upload directory exists
      try {
        await mkdir(uploadDir, { recursive: true })
      } catch (error) {
        // Directory might already exist
      }

      for (const file of files) {
        // Validate file
        if (!file.name || !file.size) {
          continue
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { error: `Invalid file type: ${file.type}. Only JPEG, PNG, and WebP are allowed.` },
            { status: 400 }
          )
        }

        // Check file size (5MB max)
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
          return NextResponse.json(
            { error: `File too large. Maximum size is 5MB.` },
            { status: 400 }
          )
        }

        // Generate unique filename
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 8)
        const extension = path.extname(file.name)
        const filename = `${timestamp}_${randomString}${extension}`
        const filepath = path.join(uploadDir, filename)

        // Save file
        const buffer = await file.arrayBuffer()
        await writeFile(filepath, Buffer.from(buffer))

        // Return file info
        uploadedFiles.push({
          filename,
          originalName: file.name,
          size: file.size,
          type: file.type,
          url: `/uploads/products/${filename}`
        })
      }

      return NextResponse.json({
        success: true,
        files: uploadedFiles,
        message: `${uploadedFiles.length} file(s) uploaded successfully`
      })
    } catch (error) {
      console.error('Upload error:', error)
      return NextResponse.json(
        { error: 'Failed to upload files' },
        { status: 500 }
      )
    }
  }, { rateLimitType: 'fileUpload' })()
}
