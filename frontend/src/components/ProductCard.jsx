import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Rating, Chip, IconButton, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  overflow: 'hidden',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transform: 'translateY(-2px)',
    borderColor: '#ff9900',
  },
}))

const StyledImage = styled(CardMedia)({
  height: 160,
  objectFit: 'contain',
  padding: '8px',
  backgroundColor: '#fff',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  },
})

const PriceBox = styled(Box)({
  display: 'flex',
  alignItems: 'baseline',
  gap: '4px',
  marginTop: '8px',
})

const Price = styled(Typography)({
  fontSize: '18px',
  fontWeight: 600,
  color: '#B12704',
})

const CategoryChip = styled(Chip)({
  fontSize: '10px',
  height: '20px',
  marginBottom: '8px',
})

export default function ProductCard({ product }) {
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { user } = useAuth()
  const { add } = useCart();
  const img = product.image || `https://via.placeholder.com/300x200?text=${encodeURIComponent(product.name)}`;
  const rating = product.rating || 0;
  const reviews = product.reviews || 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to add items to your cart');
      return;
    }
    add(product, 1);
  };

  const handleWishlistClick = (e) => {
    e.preventDefault()
    if (!user) {
      alert('Please login to add items to your wishlist')
      return
    }
    toggleWishlist(product)
  }
  
  return (
    <StyledCard component={RouterLink} to={`/product/${product.id}`} sx={{ textDecoration: 'none', color: 'inherit' }} className="product-card">
      <Box sx={{ position: 'relative' }}>
        <StyledImage
          component="img"
          src={img}
          alt={product.name}
          sx={{ width: '100%' }}
          onError={(e) => {
            e.currentTarget.src = `https://placehold.co/300x200?text=${encodeURIComponent(product.name)}`
          }}
        />
        <IconButton
          onClick={handleWishlistClick}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(255,255,255,0.9)',
            '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
          }}
        >
          {user && isInWishlist(product.id) ? (
            <FavoriteIcon sx={{ color: '#ff1744' }} />
          ) : (
            <FavoriteBorderIcon sx={{ color: '#666' }} />
          )}
        </IconButton>
        {product.discount > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: '#ff4444',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            -{product.discount}%
          </Box>
        )}
        {product.stock === 0 && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            Out of Stock
          </Box>
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column' }}>
        <CategoryChip label={product.category} size="small" color="primary" variant="outlined" />
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 500,
            fontSize: '14px',
            lineHeight: 1.4,
            minHeight: '40px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: '#0F1111',
            marginBottom: '8px',
          }}
        >
          {product.name}
        </Typography>
        
        {rating > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
            <Rating value={rating} readOnly size="small" precision={0.1} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
              ({reviews})
            </Typography>
          </Box>
        )}
        
        <PriceBox>
          <Price>
            ${product.discount > 0 
              ? (product.price * (1 - product.discount / 100)).toFixed(2)
              : product.price.toFixed(2)
            }
          </Price>
          {product.discount > 0 && (
            <Typography 
              variant="body2" 
              sx={{ 
                textDecoration: 'line-through', 
                color: '#666',
                fontSize: '14px'
              }}
            >
              ${product.price.toFixed(2)}
            </Typography>
          )}
        </PriceBox>
        {product.stock > 0 && (
          <Typography variant="caption" color="success.main" sx={{ fontWeight: 'medium' }}>
            In Stock ({product.stock})
          </Typography>
        )}
        {product.stock === 0 && (
          <Typography variant="caption" color="error.main" sx={{ fontWeight: 'medium' }}>
            Out of Stock
          </Typography>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Button 
          variant="contained" 
          color="primary" 
          size="small" 
          startIcon={<ShoppingCartIcon />}
          onClick={handleAddToCart}
          disabled={product.stock === 0 || !user}
          sx={{ 
            mt: 1, 
            backgroundColor: '#ff9900', 
            '&:hover': { backgroundColor: '#ff7b00' },
            textTransform: 'none',
            fontSize: '12px'
          }}
        >
          Add to Cart
        </Button>
      </CardContent>
    </StyledCard>
  )
}
