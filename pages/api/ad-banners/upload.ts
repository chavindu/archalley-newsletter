import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { put } from '@vercel/blob'
import sharp from 'sharp'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function parseFormData(req: NextApiRequest): Promise<{ buffer: Buffer; filename: string; mimetype: string }> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const buffer = Buffer.concat(chunks)
  // Very simple parse: expecting raw binary upload with query filename & type
  const filename = (req.query.filename as string) || `banner-${Date.now()}.png`
  const mimetype = (req.query.mimetype as string) || 'image/png'
  return { buffer, filename, mimetype }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  try {
    const { buffer, filename, mimetype } = await parseFormData(req)

    // Validate size (<= 2MB)
    const maxBytes = 2 * 1024 * 1024
    if (buffer.length > maxBytes) {
      return res.status(400).json({ message: 'File too large (max 2MB)' })
    }

    // Validate type
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
    if (!allowed.includes(mimetype)) {
      return res.status(400).json({ message: 'Invalid file type' })
    }

    // Process image: enforce 34:9 aspect via cover resize and produce 600px width
    const resized = await sharp(buffer)
      .resize({ width: 600, height: Math.round(600 * 9 / 34), fit: 'cover', position: 'centre' })
      .toFormat('png')
      .toBuffer()

    const timestamp = Date.now()
    const cleanFilename = filename.replace(/\s+/g, '-')
    const basePath = `ad-banners/${timestamp}-${cleanFilename}`
    const path600 = basePath.replace(/\.[a-zA-Z]+$/, '') + '-600.png'

    // Upload 600px version to Vercel Blob
    const { url: url600 } = await put(path600, resized, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: 'image/png',
    })

    // Also upload original file as provided
    const { url: urlOriginal } = await put(basePath, buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: mimetype,
    })

    return res.status(200).json({ image_path: urlOriginal, image_url_600: url600 })
  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}


