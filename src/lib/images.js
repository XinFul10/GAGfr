// Helper to resolve image paths or URLs to a usable public URL.
export function getOrigin() {
  return (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace('/api', '')
}

export function buildImageUrl(pathOrUrl) {
  if (!pathOrUrl) return null
  try {
    const u = new URL(pathOrUrl)
    return u.href
  } catch (e) {
    const origin = getOrigin()
    const str = String(pathOrUrl)
    // If running in dev (no VITE_API_URL host override) prefer relative /storage paths
    const preferRelative = !import.meta.env.VITE_API_URL
    if (str.startsWith('/')) {
      // e.g. "/storage/product_images/abc.jpg"
      return preferRelative && str.startsWith('/storage') ? str : `${origin}${str}`
    }
    if (str.includes('public/storage')) {
      const cleaned = `/${str.replace(/^\/+/, '')}`
      return preferRelative ? cleaned.replace('/public', '') : `${origin}/${str.replace(/^\/+/, '')}`
    }
    if (str.includes('/storage') || str.startsWith('storage/')) {
      const cleaned = str.startsWith('storage/') ? `/${str}` : `/${str.replace(/^\/+/, '')}`
      return preferRelative ? cleaned : `${origin}/${cleaned.replace(/^\/+/, '')}`
    }
    // default: treat as storage path
    const def = `/storage/${str.replace(/^\/+/, '')}`
    return preferRelative ? def : `${origin}${def}`
  }
}

export function resolveProductImage(product) {
  if (!product) return null
  if (product.image_url) return product.image_url
  if (product.product_image_url) return product.product_image_url
  if (product.productImageUrl) return product.productImageUrl
  if (product.productImage) return buildImageUrl(product.productImage)
  if (product.image) return buildImageUrl(product.image)
  return null
}
