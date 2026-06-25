// Uploads an image to Cloudinary (unsigned) when configured, else returns a
// base64 data URL. Activates automatically once the two env vars are set —
// no code changes needed.
const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD as string | undefined
const PRESET = import.meta.env.VITE_CLOUDINARY_PRESET as string | undefined

export const usingCloudinary = Boolean(CLOUD && PRESET)

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function uploadImage(file: File): Promise<string> {
  if (!usingCloudinary) return toBase64(file)
  try {
    const form = new FormData()
    form.append('file', file)
    form.append('upload_preset', PRESET as string)
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body: form })
    if (!res.ok) throw new Error('upload failed')
    const data = await res.json()
    return data.secure_url
  } catch {
    return toBase64(file) // fall back so submission never breaks
  }
}
