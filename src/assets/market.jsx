import React, { useState, useEffect } from 'react'
import './market.css'
import { apiRequest } from '../lib/api'
import { addNotification } from '../lib/notifications'
import { addToCart, getCartCount } from '../lib/cart'
import { resolveProductImage, buildImageUrl, getOrigin } from '../lib/images'
import { useNavigate } from 'react-router-dom'

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <p>Please refresh the page and try again.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default function Market({ user, onNavigateBack }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    description: '',
    image: null
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [cartCount, setCartCount] = useState(getCartCount())
  const navigate = useNavigate()

  const handleOpenCart = () => {
    // Ensure parent stops forcing the Market view so routes can render
    if (typeof onNavigateBack === 'function') {
      onNavigateBack()
    }
    // Navigate right after allowing routes to take control
    setTimeout(() => navigate('/cart'), 0)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await apiRequest('/market/products')
      console.log('Market.getProducts response:', data)
      if (Array.isArray(data.products) && data.products.length > 0) {
        console.log('First product sample:', data.products[0])
      }
      setProducts(Array.isArray(data.products) ? data.products : [])
    } catch (error) {
      console.error('Error loading products:', error)
      setProducts([])
      alert('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, or GIF)')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }
      
      setNewProduct({ ...newProduct, image: file })
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('name', newProduct.name)
      formData.append('description', newProduct.description)
      formData.append('price', newProduct.price)
      formData.append('stock', newProduct.stock)
      formData.append('seller_id', user.id)
      
      if (newProduct.image) {
        formData.append('image', newProduct.image)
      }

      await apiRequest('/market/products', {
        method: 'POST',
        body: formData
      })
      
      setNewProduct({ name: '', price: '', stock: '', description: '', image: null })
      setImagePreview(null)
      setShowAddForm(false)
      loadProducts()
      alert('Product added successfully!')
    } catch (error) {
      console.error('Error adding product:', error)
      const details = error?.data?.details || error?.data || error?.message || 'Failed to add product'
      if (typeof details === 'object') {
        alert('Failed to add product: ' + JSON.stringify(details))
      } else {
        alert('Failed to add product: ' + String(details))
      }
    } finally {
      setUploading(false)
    }
  }

  const handleAddToCart = (product) => {
    addToCart(product, 1)
    setCartCount(getCartCount())
  }

  const handlePurchase = async (productId) => {
    if (!productId) {
      alert('Invalid product ID')
      return
    }
    
    try {
      const res = await apiRequest(`/market/products/${productId}/purchase`, {
        method: 'POST',
        body: JSON.stringify({ buyer_id: user.id })
      })
      // Backend returns updated product with seller/buyer relation
      const purchasedProduct = res.product
      // Server will create a notification for the seller. We'll log it and
      // add a local fallback notification only if the current client is the seller
      try {
        console.log('Purchase response notification:', res.notification)
        if (res.notification && res.notification.seller_id === user.id) {
          const getOrigin = () => {
            try {
              const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
              const parsed = new URL(apiUrl)
              return parsed.origin
            } catch (e) {
              return 'http://localhost:8000'
            }
          }
          const imageUrl = resolveProductImage(purchasedProduct)
          addNotification({
            sellerId: res.notification.seller_id,
            buyerId: res.notification.buyer_id,
            buyerName: purchasedProduct.buyer?.name || user.name || 'A buyer',
            productId: purchasedProduct.id,
            productName: purchasedProduct.name,
            productImage: purchasedProduct.image,
            productImageUrl: imageUrl,
            quantity: 1,
            totalCost: Number(purchasedProduct.price || 0),
            id: res.notification.id,
            date: res.notification.created_at
          })
        }
      } catch (e) {
        console.error('Failed to handle server notification', e)
      }

      loadProducts()
      alert('Product purchased successfully!')
    } catch (error) {
      console.error('Error purchasing product:', error)
      alert('Failed to purchase product')
    }
  }

  const filteredProducts = products.filter(product =>
    product && product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <ErrorBoundary>
      <div className="market">
        <div className="market-header">
          <div className="market-nav">
            <button className="back-btn" onClick={onNavigateBack}>←</button>
            <h1>Market Menu</h1>
            <div className="header-actions">
              <button className="cart-btn" onClick={handleOpenCart}>
                🛒 {cartCount > 0 ? `(${cartCount})` : ''}
              </button>
              <button className="filter-btn">🔽</button>
            </div>
          </div>
          
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="What are you looking for?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="market-content">
          <div className="page-title">Order your needs here</div>
          
          <div className="add-product-section">
            <button 
              className="add-product-btn"
              onClick={() => {
                if (showAddForm) {
                  setNewProduct({ name: '', price: '', stock: '', description: '', image: null })
                  setImagePreview(null)
                }
                setShowAddForm(!showAddForm)
              }}
            >
              {showAddForm ? 'Cancel' : '+ Add Product'}
            </button>
          </div>

          {showAddForm && (
            <div className="add-product-form">
              <h3>Add New Product</h3>
              <form onSubmit={handleAddProduct}>
                <input
                  type="text"
                  placeholder="Product Name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  required
                />
                <input
                  type="number"
                  placeholder="Price (₱)"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  required
                  min="0"
                  step="0.01"
                />
                <input
                  type="number"
                  placeholder="Stock Quantity"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                  required
                  min="1"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
                <div className="image-upload-section">
                  <label htmlFor="image-upload" className="image-upload-label">
                    {imagePreview ? 'Change Image' : 'Select Image'}
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <button 
                        type="button" 
                        className="remove-image-btn"
                        onClick={() => {
                          setImagePreview(null)
                          setNewProduct({...newProduct, image: null})
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <button type="submit" className="submit-btn" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Add Product'}
                </button>
              </form>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading products...</div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id || `product-${index}`}
                  product={product}
                onPurchase={handlePurchase}
                onAddToCart={handleAddToCart}
                  isOwner={product.seller_id === user.id}
                />
              ))}
            </div>
          )}

          {filteredProducts.length === 0 && !loading && (
            <div className="no-products">
              <p>No products found. Be the first to add a product!</p>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}

function ProductCard({ product, onPurchase, onAddToCart, isOwner }) {
  // Ensure we have valid product data
  if (!product) {
    return <div className="product-card">Loading...</div>
  }

  // Safely format the price
  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return price.toFixed(2)
    }
    if (typeof price === 'string') {
      const numPrice = parseFloat(price)
      return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2)
    }
    return '0.00'
  }

  // Safely get stock value
  const stock = typeof product.stock === 'number' ? product.stock : parseInt(product.stock) || 0

  const getServerOrigin = () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      const parsed = new URL(apiUrl)
      return parsed.origin
    } catch (e) {
      return 'http://localhost:8000'
    }
  }

  const resolvedImageSrc = resolveProductImage(product)

  return (
    <div className="product-card">
      <div className="product-header">
        <h3 className="product-name">{product.name || 'Unnamed Product'}</h3>
        <button className="favorite-btn">♡</button>
      </div>
      
      <div className="product-image">
        {resolvedImageSrc ? (
          <img 
            src={resolvedImageSrc}
            alt={product.name || 'Product'} 
            onError={(e) => {
              try {
                console.warn('Image failed to load, attempting storage fallback:', e.target.src)
                // Try a storage fallback if the original was not a storage URL
                const origin = getServerOrigin()
                const tryUrl = product.image ? `${origin}/storage/${String(product.image).replace(/^\/+/, '')}` : null
                if (tryUrl && tryUrl !== e.target.src) {
                  e.target.onerror = null
                  e.target.src = tryUrl
                  return
                }
              } catch (err) {
                // ignore
              }
              e.target.style.display = 'none'
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div className="placeholder-image" style={{ display: resolvedImageSrc ? 'none' : 'flex' }}>📦</div>
      </div>
      
      <div className="product-footer">
        <div className="product-price">₱ {formatPrice(product.price)}</div>
        <div className="product-stock">Stock: {stock}</div>
        {!isOwner && stock > 0 ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className="add-to-cart-btn"
              onClick={() => onAddToCart(product)}
            >
              +
            </button>
            <button 
              className="submit-btn"
              onClick={() => onPurchase(product.id)}
            >
              Buy
            </button>
          </div>
        ) : (
          <div className="sold-out">Sold Out</div>
        )}
      </div>
    </div>
  )
}
