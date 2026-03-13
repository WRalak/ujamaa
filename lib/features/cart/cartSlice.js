import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// Async thunks for API calls
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        return rejectWithValue('No token found')
      }

      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch cart')
      }

      const data = await response.json()
      return data.cart
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const addToCartAPI = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        return rejectWithValue('No token found')
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add to cart')
      }

      const data = await response.json()
      return data.cart
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        return rejectWithValue('No token found')
      }

      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'update',
          items: [{ productId, quantity }]
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update cart')
      }

      const data = await response.json()
      return data.cart
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const clearCartAPI = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        return rejectWithValue('No token found')
      }

      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'clear' })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to clear cart')
      }

      const data = await response.json()
      return data.cart
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        items: [],
        totalAmount: 0,
        totalItems: 0,
        loading: false,
        error: null
    },
    reducers: {
        clearError: (state) => {
            state.error = null
        },
        // Keep local reducers for optimistic updates
        addToCartLocal: (state, action) => {
            const { productId } = action.payload
            const existingItem = state.items.find(item => item.product._id === productId)
            if (existingItem) {
                existingItem.quantity += 1
            } else {
                state.items.push({
                    product: { _id: productId },
                    quantity: 1
                })
            }
            state.totalItems += 1
        },
        removeFromCartLocal: (state, action) => {
            const { productId } = action.payload
            const existingItem = state.items.find(item => item.product._id === productId)
            if (existingItem) {
                existingItem.quantity -= 1
                if (existingItem.quantity === 0) {
                    state.items = state.items.filter(item => item.product._id !== productId)
                }
            }
            state.totalItems -= 1
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch cart
            .addCase(fetchCart.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.loading = false
                state.items = action.payload.items
                state.totalAmount = action.payload.totalAmount
                state.totalItems = action.payload.totalItems
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Add to cart
            .addCase(addToCartAPI.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(addToCartAPI.fulfilled, (state, action) => {
                state.loading = false
                state.items = action.payload.items
                state.totalAmount = action.payload.totalAmount
                state.totalItems = action.payload.totalItems
            })
            .addCase(addToCartAPI.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Update cart item
            .addCase(updateCartItem.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(updateCartItem.fulfilled, (state, action) => {
                state.loading = false
                state.items = action.payload.items
                state.totalAmount = action.payload.totalAmount
                state.totalItems = action.payload.totalItems
            })
            .addCase(updateCartItem.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Clear cart
            .addCase(clearCartAPI.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(clearCartAPI.fulfilled, (state, action) => {
                state.loading = false
                state.items = action.payload.items
                state.totalAmount = action.payload.totalAmount
                state.totalItems = action.payload.totalItems
            })
            .addCase(clearCartAPI.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
    }
})

export const { clearError, addToCartLocal, removeFromCartLocal } = cartSlice.actions

export default cartSlice.reducer
