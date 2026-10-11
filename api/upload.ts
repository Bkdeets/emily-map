import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { safeEqual, json } from './_lib/auth.js'

// Issues short-lived tokens so the browser can upload photos straight to Vercel Blob.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const expected = process.env.ADMIN_PASSWORD
        if (!expected || !safeEqual(clientPayload ?? '', expected)) throw new Error('Wrong admin password')
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif'],
          maximumSizeInBytes: 25 * 1024 * 1024,
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async () => {},
    })
    return json(result)
  } catch (error) {
    return json({ error: (error as Error).message }, 400)
  }
}
