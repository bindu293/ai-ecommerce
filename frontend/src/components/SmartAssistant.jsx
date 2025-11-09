import React, { useMemo, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Stepper, Step, StepLabel, Select, MenuItem, FormControl, InputLabel, Slider, TextField, Chip } from '@mui/material'
import api from '../services/api'

export default function SmartAssistant({ open, onClose, onComplete, categories = [] }) {
  const [activeStep, setActiveStep] = useState(0)
  const [answers, setAnswers] = useState({ category: 'all', budget: [0, 1500], purpose: '', minRating: 0, brandPref: 'none', brand: '' })
  const steps = ['Category', 'Budget', 'Purpose', 'Rating', 'Brand']
  const categoryOptions = useMemo(() => (categories.length ? categories : ['all', 'Electronics', 'Clothing', 'Home', 'Beauty', 'Sports', 'Accessories']), [categories])

  const next = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1))
  const back = () => setActiveStep((s) => Math.max(s - 1, 0))

  const startOver = () => {
    setActiveStep(0)
    setAnswers({ category: 'all', budget: [0, 1500], purpose: '', minRating: 0, brandPref: 'none', brand: '' })
  }

  const handleComplete = async () => {
    const res = await api.get('/products?limit=200')
    const all = res.data.data || res.data || []
    const picks = scoreProducts(all, answers).slice(0, 5)
    onComplete(picks, answers)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Smart Shopping Assistant</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Answer a few quick questions. I’ll find the best matches and explain why.
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Box>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={answers.category}
                label="Category"
                onChange={(e) => setAnswers((a) => ({ ...a, category: e.target.value }))}
              >
                {categoryOptions.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
              Budget range: ${answers.budget[0]} - ${answers.budget[1]}
            </Typography>
            <Slider
              value={answers.budget}
              onChange={(_, v) => setAnswers((a) => ({ ...a, budget: v }))}
              min={0}
              max={1500}
              step={25}
              valueLabelDisplay="auto"
              sx={{ color: '#ff9900' }}
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              {[ [0,50], [50,100], [100,200], [200,500], [500,1500] ].map((r) => (
                <Chip key={r.join('-')} label={`$${r[0]} - $${r[1]}`} clickable onClick={() => setAnswers((a) => ({ ...a, budget: r }))} />
              ))}
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>Select a purpose or type your own:</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              {['daily', 'gift', 'office', 'travel', 'fashion', 'fitness', 'home', 'gaming'].map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  color={answers.purpose === tag ? 'primary' : 'default'}
                  variant={answers.purpose === tag ? 'filled' : 'outlined'}
                  onClick={() => setAnswers((a) => ({ ...a, purpose: tag }))}
                  clickable
                />
              ))}
            </Box>
            <TextField
              fullWidth
              size="small"
              placeholder="Or type a purpose (e.g., skincare, office)"
              value={answers.purpose}
              onChange={(e) => setAnswers((a) => ({ ...a, purpose: e.target.value }))}
            />
          </Box>
        )}

        {activeStep === 3 && (
          <Box>
            <FormControl fullWidth size="small">
              <InputLabel>Minimum Rating</InputLabel>
              <Select
                value={answers.minRating}
                label="Minimum Rating"
                onChange={(e) => setAnswers((a) => ({ ...a, minRating: Number(e.target.value) }))}
              >
                <MenuItem value={0}>Any</MenuItem>
                <MenuItem value={4.0}>4.0+</MenuItem>
                <MenuItem value={4.5}>4.5+</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        {activeStep === 4 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>Brand preference:</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              {[
                { key: 'none', label: 'No preference' },
                { key: 'prefer', label: 'Prefer brand' },
              ].map((opt) => (
                <Chip
                  key={opt.key}
                  label={opt.label}
                  color={answers.brandPref === opt.key ? 'primary' : 'default'}
                  variant={answers.brandPref === opt.key ? 'filled' : 'outlined'}
                  onClick={() => setAnswers((a) => ({ ...a, brandPref: opt.key }))}
                  clickable
                />
              ))}
            </Box>
            <TextField
              fullWidth
              size="small"
              label="Brand or keyword"
              placeholder="Optional (e.g., pro, lite, eco)"
              value={answers.brand}
              onChange={(e) => setAnswers((a) => ({ ...a, brand: e.target.value }))}
              disabled={answers.brandPref === 'none'}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={startOver}>Restart Quiz</Button>
        {activeStep > 0 && <Button onClick={back}>Back</Button>}
        {activeStep < steps.length - 1 ? (
          <Button variant="contained" onClick={next}>Next</Button>
        ) : (
          <Button variant="contained" color="primary" onClick={handleComplete}>Show Recommendations</Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

function scoreProducts(products, { category, budget, purpose, minRating, brandPref, brand }) {
  const [minPrice, maxPrice] = budget
  const purposeLower = (purpose || '').toLowerCase()
  const brandLower = (brand || '').toLowerCase()

  // Base filtering (category + rating)
  let candidates = products.filter((p) => {
    const rating = Number(p.rating || 0)
    const categoryOK = !category || category === 'all' || p.category === category
    const ratingOK = rating >= (minRating || 0)
    return categoryOK && ratingOK
  })

  // Budget filter with graceful fallback
  const budgetCandidates = candidates.filter((p) => Number(p.price || 0) >= minPrice && Number(p.price || 0) <= maxPrice)
  if (budgetCandidates.length > 0) {
    candidates = budgetCandidates
  } else {
    candidates = candidates.filter((p) => Number(p.price || 0) >= minPrice * 0.8 && Number(p.price || 0) <= maxPrice * 1.2)
  }

  return candidates
    .map((p) => {
      let score = 0
      const reasons = []
      const price = Number(p.price || 0)
      const rating = Number(p.rating || 0)
      const desc = (p.description || '').toLowerCase()
      const name = (p.name || '').toLowerCase()

      if (category && category !== 'all' && p.category === category) {
        score += 4
        reasons.push(`Fits your category: ${category}`)
      }

      if (price >= minPrice && price <= maxPrice) {
        score += 3
        reasons.push('Recommended because it fits your budget')
      } else {
        score += 1
        reasons.push('Close to your budget')
      }

      if (purposeLower) {
        if (desc.includes(purposeLower) || name.includes(purposeLower)) {
          score += 2
          const purposeText = purposeLower === 'office' ? 'Popular for office use' : `Great for ${purpose}`
          reasons.push(purposeText)
        }
      }

      if (brandPref === 'prefer' && brandLower && (name.includes(brandLower) || desc.includes(brandLower))) {
        score += 2
        reasons.push('Matches your brand/keyword preference')
      }

      score += (rating / 5) * 2
      if (rating >= 4.5) reasons.push('Best rated')
      else if (rating >= 4.0) reasons.push('Well rated')

      if ((p.stock || 0) > 0) {
        score += 1
        reasons.push('In stock and ready to ship')
      }

      return { product: p, score, reasons }
    })
    .sort((a, b) => b.score - a.score)
}