import React from 'react'
import { Box, Button, Divider, List, ListItem, ListItemText, Typography } from '@mui/material'
import { useCart } from '../context/CartContext'
import { Link as RouterLink } from 'react-router-dom'

export default function Cart() {
  const { items, total, remove, updateQty, clear } = useCart()
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Your Cart</Typography>
      {!items.length && <Typography>Your cart is empty.</Typography>}
      <List>
        {items.map(it => (
          <ListItem key={it.id} secondaryAction={
            <>
              <input type="number" min="1" value={it.qty} style={{ width: 64 }} onChange={(e) => updateQty(it.id, e.target.value)} />
              <Button color="error" onClick={() => remove(it.id)}>Remove</Button>
            </>
          }>
            {(() => {
              const price = Number(it.price) || 0
              return (
                <ListItemText primary={`${it.name}`} secondary={`$${price.toFixed(2)} x ${it.qty}`} />
              )
            })()}
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6">Total: ${(Number(total) || 0).toFixed(2)}</Typography>
      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button component={RouterLink} to="/checkout" variant="contained" disabled={!items.length}>Checkout</Button>
        <Button onClick={clear}>Clear</Button>
      </Box>
    </Box>
  )
}
