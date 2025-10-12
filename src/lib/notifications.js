const KEY = 'app_notifications_v1'

export function getNotifications() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) { return [] }
}

export function addNotification(n) {
  const list = getNotifications()
  list.unshift({ ...n, date: new Date().toISOString() })
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)))
}

export function clearNotifications() {
  localStorage.removeItem(KEY)
}

// Remove a single notification by id for a given seller
export function removeNotificationForSeller(id, sellerId) {
  const list = getNotifications()
  const filtered = list.filter(n => {
    if (sellerId && n.sellerId !== sellerId) return true
    return n.id ? n.id !== id : true
  })
  localStorage.setItem(KEY, JSON.stringify(filtered))
}

// Clear only the notifications that belong to a specific seller
export function clearNotificationsForSeller(sellerId) {
  if (!sellerId) return clearNotifications()
  const list = getNotifications()
  const filtered = list.filter(n => n.sellerId !== sellerId)
  localStorage.setItem(KEY, JSON.stringify(filtered))
}
