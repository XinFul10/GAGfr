import React, { useState, useEffect } from 'react'
import './market.css'
import { apiRequest } from '../lib/api'
import { addNotification } from '../lib/notifications'

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

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await apiRequest('/market/products')
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
      alert('Failed to add product')
    } finally {
      setUploading(false)
    }
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
          addNotification({
            sellerId: res.notification.seller_id,
            buyerId: res.notification.buyer_id,
            buyerName: purchasedProduct.buyer?.name || user.name || 'A buyer',
            productId: purchasedProduct.id,
            productName: purchasedProduct.name,
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
              <button className="cart-btn">🛒</button>
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

function ProductCard({ product, onPurchase, isOwner }) {
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

  return (
    <div className="product-card">
      <div className="product-header">
        <h3 className="product-name">{product.name || 'Unnamed Product'}</h3>
        <button className="favorite-btn">♡</button>
      </div>
      
      <div className="product-image">
        {(product.image_url || product.image) ? (
          <img 
            src={product.image_url || `${(import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace('/api', '')}/storage/${product.image}`}
            alt={product.name || 'Product'} 
            onError={(e) => {
              console.error('Image failed to load:', e.target.src)
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div className="placeholder-image" style={{ display: (product.image_url || product.image) ? 'none' : 'flex' }}>📦</div>
      </div>
      
      <div className="product-footer">
        <div className="product-price">₱ {formatPrice(product.price)}</div>
        <div className="product-stock">Stock: {stock}</div>
        {!isOwner && stock > 0 ? (
          <button 
            className="add-to-cart-btn"
            onClick={() => onPurchase(product.id)}
          >
            +
          </button>
        ) : (
          <div className="sold-out">Sold Out</div>
        )}
      </div>
    </div>
  )
}
