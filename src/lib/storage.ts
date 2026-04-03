// ===== Supabase Storage — upload helpers for photos & attachments =====
import { supabase } from './supabase'

/**
 * Convert a base64 data URL to a Blob for upload.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'application/octet-stream'
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

/**
 * Upload a blob to Supabase Storage and return the public URL.
 */
export async function uploadFile(
  bucket: string,
  path: string,
  blob: Blob,
  contentType: string
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { contentType, upsert: true })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Upload a photo to the dsr-photos bucket.
 * Returns the public URL of the uploaded photo.
 */
export async function uploadPhoto(params: {
  projectCode: string
  date: string
  reportId: number
  photoId: string
  dataUrl: string
}): Promise<string> {
  const blob = dataUrlToBlob(params.dataUrl)
  const ext = blob.type.split('/')[1] || 'jpg'
  const path = `${params.projectCode}/${params.date}/${params.reportId}/photos/${params.photoId}.${ext}`
  return uploadFile('dsr-photos', path, blob, blob.type)
}

/**
 * Upload an attachment to the dsr-attachments bucket.
 * Returns the public URL of the uploaded attachment.
 */
export async function uploadAttachment(params: {
  projectCode: string
  date: string
  reportId: number
  attachmentId: string
  fileName: string
  dataUrl: string
  mimeType: string
}): Promise<string> {
  const blob = dataUrlToBlob(params.dataUrl)
  const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${params.projectCode}/${params.date}/${params.reportId}/attachments/${params.attachmentId}-${safeName}`
  return uploadFile('dsr-attachments', path, blob, params.mimeType)
}
