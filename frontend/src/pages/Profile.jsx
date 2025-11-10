import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Paper,
  Divider,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { deepOrange } from '@mui/material/colors';

export default function Profile() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }

    api
      .get('/orders?limit=3') // Fetch only the 3 most recent orders
      .then((res) => setOrders(res.data?.data || []))
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }, [user, authLoading])

  if (loading || authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Welcome!
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Please log in to view your profile and order history.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/login')}>
          Go to Login
        </Button>
      </Box>
    )
  }

  const recentOrder = orders.length > 0 ? orders[0] : null

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, backgroundColor: '#f4f6f8' }}>
      <Paper sx={{ p: 4, mb: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
        <Avatar sx={{ bgcolor: deepOrange[500], width: 80, height: 80, fontSize: '2.5rem' }}>
          {user.email ? user.email[0].toUpperCase() : 'U'}
        </Avatar>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#333' }}>
            Welcome Back!
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {user.displayName || user.email}
          </Typography>
        </Box>
      </Paper>

      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                My Orders
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {`Failed to load orders: ${error}`}
                </Alert>
              )}
              {orders.length > 0 ? (
                <List>
                  {orders.map((o, index) => (
                    <React.Fragment key={o.id}>
                      <ListItem sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <ListItemText
                          primary={`Order #${o.id}`}
                          secondary={`Status: ${o.status} | Total: $${o.total.toFixed(2)}`}
                        />
                        <Button component={RouterLink} to={`/orders/${o.id}`} size="small">
                          View Details
                        </Button>
                      </ListItem>
                      {index < orders.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography sx={{ mt: 2, color: 'text.secondary' }}>
                  You haven't placed any orders yet.
                </Typography>
              )}
              <Button component={RouterLink} to="/orders" sx={{ mt: 2 }}>
                View All Orders
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
