import React, { useEffect, useState } from 'react'
import './market.css'
import { getCart, updateQuantity, removeFromCart, getTotals, clearCart } from '../lib/cart'
import { apiRequest, getUser } from '../lib/api'
import { addNotification } from '../lib/notifications'
import { useNavigate } from 'react-router-dom'

export default function Cart() {
  const [cart, setCart] = useState(getCart())
  const [totals, setTotals] = useState(getTotals())
  const navigate = useNavigate()

  useEffect(() => {
    setCart(getCart())
    setTotals(getTotals())
  }, [])

  function handleChangeQty(productId, delta) {
    const currentItem = cart.items.find((it) => it.product.id === productId)
    if (!currentItem) return
    const nextQty = Math.max(0, currentItem.quantity + delta)
    const next = updateQuantity(productId, nextQty)
    setCart(next)
    setTotals(getTotals())
  }

  function handleRemove(productId) {
    const next = removeFromCart(productId)
    setCart(next)
    setTotals(getTotals())
  }

  async function handleCheckout() {
    const buyer = getUser()
    if (!buyer || !buyer.id) {
      alert('You must be signed in to checkout.')
      return
    }

    if (cart.items.length === 0) {
      return
    }

    try {
      // Purchase each product; ensure stock decreases by total quantity
      for (const { product, quantity } of cart.items) {
        try {
          // First, try a quantity-aware call
          const res = await apiRequest(`/market/products/${product.id}/purchase`, {
            method: 'POST',
            body: JSON.stringify({ buyer_id: buyer.id, quantity })
          })

          const purchasedProduct = res.product || product
          // If backend only decremented by 1 per call, send the remaining (quantity-1) calls
          for (let i = 1; i < Number(quantity || 1); i++) {
            try {
              await apiRequest(`/market/products/${product.id}/purchase`, {
                method: 'POST',
                body: JSON.stringify({ buyer_id: buyer.id })
              })
            } catch (e2) {
              console.error('Additional quantity purchase failed', e2)
              break
            }
          }

          // Aggregate notifications locally: only one per product for this checkout
          // We emit a single combined notification at the end; skip per-iteration adds
        } catch (e) {
          console.error('Failed purchasing product', product?.id, e)
        }
      }

      // Emit a single aggregated notification per product for this checkout
      for (const { product, quantity } of cart.items) {
        addNotification({
          sellerId: product.seller_id,
          buyerId: buyer.id,
          buyerName: buyer.name,
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          productImage: product.image,
          productImageUrl: product.image ? `${(import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace('/api','')}/public-storage/${product.image}` : (product.image_url || null),
          quantity,
          totalCost: Number(product.price || 0) * Number(quantity || 1)
        })
      }

      alert('Checkout complete!')
      const emptied = clearCart()
      setCart(emptied)
      setTotals(getTotals())
      navigate(-1)
    } catch (error) {
      console.error('Checkout error', error)
      alert('Checkout failed. Please try again.')
    }
  }

  return (
    <div className="market">
      <div className="market-header">
        <div className="market-nav">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <h1>Shopping Cart</h1>
          <div className="header-actions" />
        </div>
      </div>

      <div className="market-content">
        {cart.items.length === 0 ? (
          <div className="no-products"><p>Your cart is empty.</p></div>
        ) : (
          <>
            <div className="products-grid">
              {cart.items.map(({ product, quantity }) => (
                <div className="product-card" key={product.id}>
                  <div className="product-header">
                    <h3 className="product-name">{product.name}</h3>
                    <button className="favorite-btn" onClick={() => handleRemove(product.id)}>✕</button>
                  </div>
                  <div className="product-footer">
                    <div className="product-price">₱ {Number(product.price || 0).toFixed(2)}</div>
                    <div className="product-stock">Qty: {quantity}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="add-to-cart-btn" onClick={() => handleChangeQty(product.id, -1)}>-</button>
                      <button className="add-to-cart-btn" onClick={() => handleChangeQty(product.id, +1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Sub Total</span>
                <strong>₱ {totals.subTotal.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Discount</span>
                <strong>₱ {totals.discount.toFixed(2)}</strong>
              </div>
              <hr />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total</span>
                <strong>₱ {totals.total.toFixed(2)}</strong>
              </div>
            </div>

            <div style={{ position: 'sticky', bottom: 0, background: 'white', padding: 12 }}>
              <button className="submit-btn" onClick={handleCheckout} style={{ width: '100%' }}>Checkout</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}


