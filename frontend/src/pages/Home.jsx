import React, { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  Typography, 
  Box, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Chip,
  Container,
  Paper,
  Slider,
  Button
} from '@mui/material'
import { styled } from '@mui/material/styles'
import ProductCard from '../components/ProductCard'
import SmartAssistant from '../components/SmartAssistant'
import { ENABLE_SMART_ASSISTANT, SHOW_SMART_PICKS_REASONS } from '../config/uiFlags'
import api from '../services/api'

const FilterSection = styled(Paper)({
  padding: '20px',
  marginBottom: '24px',
  backgroundColor: '#f8f9fa',
})

const SectionTitle = styled(Typography)({
  fontSize: '24px',
  fontWeight: 600,
  marginBottom: '16px',
  color: '#0F1111',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
})

const StyledSelect = styled(Select)({
  minWidth: 200,
  backgroundColor: 'white',
})

const CategoryChip = styled(Chip)({
  margin: '4px',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#ff9900',
    color: 'white',
  },
})

export default function Home() {
  const [products, setProducts] = useState([])
  const [recs, setRecs] = useState([])
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantRecs, setAssistantRecs] = useState([])
  const [assistantCriteria, setAssistantCriteria] = useState(null)
  const smartPicksRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('newest')
  const [priceRange, setPriceRange] = useState([0, 1500])
  const location = useLocation()
  const navigate = useNavigate()

  const categories = ['all', 'Electronics', 'Clothing', 'Home', 'Beauty', 'Sports', 'Accessories']

  useEffect(() => {
    fetchProducts()
    fetchRecommendations()
  }, [category, sort, priceRange])

  // Sync search from URL query (?q=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q') || ''
    setSearch(q)
  }, [location.search])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '100',
        sort,
        ...(category !== 'all' && { category }),
        ...(priceRange[0] > 0 && { minPrice: priceRange[0].toString() }),
        ...(priceRange[1] < 1500 && { maxPrice: priceRange[1].toString() }),
      })
      console.log('Fetching products with sort:', sort, 'URL:', `/products?${params}`)
      const response = await api.get(`/products?${params}`)
      const productsData = response.data.data || response.data || []
      console.log('Received products:', productsData.length, 'First product price:', productsData[0]?.price)
      // Deduplicate by id and ensure image fallback
      const map = new Map()
      for (const p of productsData) {
        const id = p.id || p._id || String(p.name || Math.random())
        if (!map.has(id)) {
          map.set(id, {
            ...p,
            id,
            image: p.image || `https://via.placeholder.com/300x200?text=${encodeURIComponent(p.name || 'Product')}`,
          })
        }
      }
      const uniqueProducts = Array.from(map.values())
      setProducts(uniqueProducts)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecommendations = async () => {
    try {
      const params = new URLSearchParams({
        limit: '8',
        ...(category !== 'all' && { category }),
      })
      const response = await api.get(`/ai/recommendations?${params}`)
      setRecs(response.data.data || response.data || [])
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      setRecs([])
    }
  }

  const filtered = products.filter(p => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(searchLower) ||
      p.description?.toLowerCase().includes(searchLower) ||
      p.category?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <Container maxWidth="xl" sx={{ py: 4, backgroundColor: '#eaeded', minHeight: '100vh' }}>
      {/* Search and Filters */}
      <FilterSection elevation={0}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <FormControl size="small">
            <InputLabel>Sort By</InputLabel>
            <StyledSelect
              value={sort}
              label="Sort By"
              onChange={(e) => setSort(e.target.value)}
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="price-low">Price: Low to High</MenuItem>
              <MenuItem value="price-high">Price: High to Low</MenuItem>
              <MenuItem value="rating">Highest Rated</MenuItem>
            </StyledSelect>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Category</InputLabel>
            <StyledSelect
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map(cat => (
                <MenuItem key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </MenuItem>
              ))}
            </StyledSelect>
          </FormControl>

          <Box sx={{ minWidth: 200, ml: 'auto' }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
              Price Range: ${priceRange[0]} - ${priceRange[1]}
            </Typography>
            <Slider
              value={priceRange}
              onChange={(e, newValue) => setPriceRange(newValue)}
              min={0}
              max={1500}
              step={50}
              valueLabelDisplay="auto"
              sx={{ color: '#ff9900' }}
            />
          </Box>

          {ENABLE_SMART_ASSISTANT && (
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
              <Button 
                variant="contained"
                color="secondary"
                onClick={() => setAssistantOpen(true)}
                sx={{ fontWeight: 600, textTransform: 'none' }}
              >
                ✨ Smart Shopping Assistant
              </Button>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {categories.map(cat => (
            <CategoryChip
              key={cat}
              label={cat === 'all' ? 'All' : cat}
              onClick={() => setCategory(cat)}
              color={category === cat ? 'primary' : 'default'}
              variant={category === cat ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </FilterSection>

      {ENABLE_SMART_ASSISTANT && (
        <SmartAssistant 
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          onComplete={(items, answers) => { setAssistantRecs(items); setAssistantCriteria(answers); }}
          categories={categories}
        />
      )}

      {assistantRecs.length > 0 && (
        <Box sx={{ mb: 6 }} ref={smartPicksRef}>
          <SectionTitle component="div">
            🧠 Smart Picks For You
            {ENABLE_SMART_ASSISTANT && (
              <Chip label="Based on your answers" size="small" color="secondary" sx={{ ml: 1 }} />
            )}
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              {ENABLE_SMART_ASSISTANT && (
                <Chip label="Apply these as filters" color="primary" variant="outlined" onClick={applyAssistantAsFilters} />
              )}
            </Box>
          </SectionTitle>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)', xl: 'repeat(5, 1fr)' },
            gap: 2
          }}>
            {assistantRecs.map(({ product, reasons }) => (
              <Box key={`smart-${product.id}`}>
                <ProductCard product={product} />
                {SHOW_SMART_PICKS_REASONS && (
                  <Box sx={{ p: 1, mt: 1, mb: 2, backgroundColor: 'white', border: '1px solid #eee', borderRadius: 1 }}>
                    {reasons.slice(0, 3).map((r, i) => (
                      <Typography key={i} variant="caption" sx={{ display: 'block', color: 'text.secondary', wordBreak: 'break-word', lineHeight: 1.4 }}>• {r}</Typography>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Compare Top 3 removed */}

      {/* Quick Intent removed */}

      {/* AI Recommendations Section */}
      {!search && recs.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <SectionTitle component="div">
            🤖 AI Recommendations for You
            <Chip label="Powered by AI" size="small" color="primary" sx={{ ml: 1 }} />
          </SectionTitle>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(5, 1fr)',
              xl: 'repeat(6, 1fr)'
            },
            gap: 2
          }}>
            {recs.map(p => (
              <ProductCard key={`rec-${p.id}`} product={p} />
            ))}
          </Box>
        </Box>
      )}

      {/* Featured Products Section */}
      {/* New Arrivals and Featured derived from products */}
      {!search && products.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <SectionTitle component="div">
            ⭐ Featured Products
            <Chip label="Top Rated" size="small" color="secondary" sx={{ ml: 1 }} />
          </SectionTitle>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)', xl: 'repeat(6, 1fr)' },
            gap: 2
          }}>
            {products
              .filter(p => (p.rating || 0) >= 4.5)
              .slice(0, 8)
              .map(p => (
                <ProductCard key={`feat-${p.id}`} product={p} />
              ))}
          </Box>
        </Box>
      )}

      {!search && products.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <SectionTitle component="div">
            🆕 New Arrivals
            <Chip label="Latest" size="small" color="primary" sx={{ ml: 1 }} />
          </SectionTitle>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)', xl: 'repeat(6, 1fr)' },
            gap: 2
          }}>
            {[...products]
              .sort((a, b) => {
                const ad = a.createdAt ? new Date(a.createdAt).getTime() : a.id || 0
                const bd = b.createdAt ? new Date(b.createdAt).getTime() : b.id || 0
                return bd - ad
              })
              .slice(0, 8)
              .map(p => (
                <ProductCard key={`new-${p.id}`} product={p} />
              ))}
          </Box>
        </Box>
      )}
      <Box>
        <SectionTitle component="div">
          {search ? 'Search Results' : (category === 'all' ? 'All Products' : `${category} Products`)}
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2, fontWeight: 400 }}>
            {search ? `(${filtered.length} results for "${search}")` : `(${filtered.length} products)`}
          </Typography>
        </SectionTitle>
        
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading products...</Typography>
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>No products found. Try adjusting your filters{search ? ' or search terms' : ''}.</Typography>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(5, 1fr)',
              xl: 'repeat(6, 1fr)'
            },
            gap: 2
          }}>
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Box>
        )}
      </Box>
    </Container>
  )
}
  const applyAssistantAsFilters = () => {
    if (!assistantCriteria) return
    const { category: aCat, budget } = assistantCriteria
    if (aCat && aCat !== 'all') setCategory(aCat)
    if (Array.isArray(budget)) setPriceRange(budget)
    // Optionally bump sort to rating to surface best reviewed
    setSort('rating')
    // Scroll to product grid
    setTimeout(() => {
      smartPicksRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }
