import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const CartCtx = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const { user } = useAuth()

  const add = (product, qty = 1) => {
    const normalized = {
      id: String(product.id ?? product._id ?? product.name ?? Math.random()),
      name: product.name ?? 'Product',
      price: Number(product.price) || 0,
      image: product.image || `https://via.placeholder.com/300x200?text=${encodeURIComponent(product.name || 'Product')}`,
    }
    const addQty = Math.max(1, Number(qty) || 1)
    setItems((prev) => {
      const existing = prev.find((p) => p.id === normalized.id)
      if (existing) return prev.map((p) => p.id === normalized.id ? { ...p, qty: p.qty + addQty } : p)
      return [...prev, { ...normalized, qty: addQty }]
    })
    // Sync to backend cart if authenticated
    if (user && normalized.id) {
      api.post('/cart', { productId: String(normalized.id), quantity: addQty }).catch(() => {})
    }
  }
  const remove = (id) => setItems((prev) => prev.filter((p) => p.id !== id))
  const updateQty = (id, qty) => {
    const q = Math.max(1, Number(qty) || 1)
    setItems((prev) => prev.map((p) => p.id === id ? { ...p, qty: q } : p))
  }
  const clear = () => setItems([])

  const total = useMemo(() => items.reduce((sum, it) => sum + (Number(it.price) || 0) * it.qty, 0), [items])

  // When user logs in, sync local cart with backend and/or load server cart
  useEffect(() => {
    const syncOnLogin = async () => {
      if (!user) return
      try {
        const res = await api.get('/cart')
        const serverItems = res.data?.data?.items || res.data?.items || []
        if (serverItems && serverItems.length > 0) {
          // Prefer server cart to avoid duplication
          setItems(serverItems.map(si => ({
            id: String(si.productId ?? si.id ?? Math.random()),
            name: si.name ?? 'Product',
            price: Number(si.price) || 0,
            image: si.image || `https://via.placeholder.com/300x200?text=${encodeURIComponent(si.name || 'Product')}`,
            qty: Math.max(1, Number(si.quantity) || 1),
          })))
        } else if (items.length > 0) {
          // Push local items to backend if server cart is empty
          await Promise.all(items.map(it => (
            api.post('/cart', { productId: String(it.id), quantity: it.qty })
          )))
        }
      } catch (_) { /* ignore sync errors */ }
    }
    syncOnLogin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return (
    <CartCtx.Provider value={{ items, add, remove, updateQty, clear, total }}>
      {children}
    </CartCtx.Provider>
  )
}

export function useCart() { return useContext(CartCtx) }
