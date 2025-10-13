const CART_STORAGE_KEY = 'gagfr_cart_v1'

function readCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed || !Array.isArray(parsed.items)) {
      return { items: [] }
    }
    return parsed
  } catch (e) {
    return { items: [] }
  }
}

function writeCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
}

export function getCart() {
  return readCart()
}

export function getCartCount() {
  const { items } = readCart()
  return items.reduce((sum, it) => sum + it.quantity, 0)
}

export function addToCart(product, quantity = 1) {
  if (!product || !product.id) return getCart()
  const cart = readCart()
  const existing = cart.items.find((it) => it.product.id === product.id)
  if (existing) {
    existing.quantity += quantity
  } else {
    cart.items.push({ product, quantity })
  }
  writeCart(cart)
  return cart
}

export function updateQuantity(productId, quantity) {
  const cart = readCart()
  cart.items = cart.items
    .map((it) => (it.product.id === productId ? { ...it, quantity } : it))
    .filter((it) => it.quantity > 0)
  writeCart(cart)
  return cart
}

export function removeFromCart(productId) {
  const cart = readCart()
  cart.items = cart.items.filter((it) => it.product.id !== productId)
  writeCart(cart)
  return cart
}

export function clearCart() {
  const cart = { items: [] }
  writeCart(cart)
  return cart
}

export function getTotals() {
  const { items } = readCart()
  const subTotal = items.reduce((sum, it) => sum + Number(it.product.price || 0) * it.quantity, 0)
  const discountRate = 0
  const discount = subTotal * discountRate
  const shipping = 0
  const total = subTotal - discount
  return { subTotal, discount, shipping, total }
}


