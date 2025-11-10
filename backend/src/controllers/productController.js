// Product Controller
// Handles all product-related operations (CRUD)

const { db } = require('../../config/firebase');
const sampleProducts = require('../../utils/sampleData');
const { generateProductDescription } = require('../services/aiService');

/**
 * Get All Products
 * Supports filtering by category, search query, and sorting
 */
const getAllProducts = async (req, res) => {
  try {
    const { category, search, limit = 100, sort = 'newest', minPrice, maxPrice } = req.query;
    
    // Fallback: if Firestore is not configured, serve sample data
    if (!db) {
      let products = sampleProducts.map((p, idx) => {
        const createdAt = p.createdAt ? new Date(p.createdAt).getTime() : 0;
        const price = typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0;
        return {
          id: p.id || `sample-${idx + 1}`,
          ...p,
          price,
          _createdAt: createdAt,
        };
      });

      // Apply category filter
      if (category && category !== 'all') {
        products = products.filter(product => product.category === category);
      }

      // Apply search filter
      if (search) {
        const searchLower = String(search).toLowerCase();
        products = products.filter(product => 
          (product.name || '').toLowerCase().includes(searchLower) ||
          (product.description || '').toLowerCase().includes(searchLower)
        );
      }

      // Apply price filters
      const min = minPrice ? parseFloat(minPrice) : null;
      const max = maxPrice ? parseFloat(maxPrice) : null;
      if (min !== null) {
        products = products.filter(p => (p.price ?? 0) >= min);
      }
      if (max !== null) {
        products = products.filter(p => (p.price ?? 0) <= max);
      }

      // Apply sorting
      switch (String(sort)) {
        case 'price_low_to_high':
          products.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
          break;
        case 'price_high_to_low':
          products.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
          break;
        case 'rating':
          products.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
          break;
        case 'newest':
        default:
          products.sort((a, b) => (b._createdAt ?? 0) - (a._createdAt ?? 0));
      }

      const lim = parseInt(limit) || 100;
      const sliced = products.slice(0, lim);
      return res.status(200).json({ success: true, count: sliced.length, data: sliced });
    }

    let productsRef = db.collection('products');
    
    // Apply category filter
    if (category && category !== 'all') {
      productsRef = productsRef.where('category', '==', category);
    }
    
    // Get products (fetch more than limit to ensure proper sorting)
    // Fetch up to 1000 products for sorting, then limit after sorting
    const maxFetchLimit = 1000;
    const snapshot = await productsRef.limit(maxFetchLimit).get();
    
    let products = [];
    snapshot.forEach(doc => {
      const productData = doc.data();
      // Convert createdAt to timestamp for sorting
      const createdAt = productData.createdAt ? new Date(productData.createdAt).getTime() : 0;
      // Ensure price is a number
      const price = typeof productData.price === 'number' ? productData.price : parseFloat(productData.price) || 0;
      products.push({ 
        id: doc.id, 
        ...productData,
        price: price,
        _createdAt: createdAt
      });
    });
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower)
      );
    }

    // Apply price filter
    if (minPrice || maxPrice) {
      products = products.filter(product => {
        const price = product.price || 0;
        if (minPrice && price < parseFloat(minPrice)) return false;
        if (maxPrice && price > parseFloat(maxPrice)) return false;
        return true;
      });
    }

    // Apply sorting (ensure prices are numbers)
    console.log(`Sorting products by: ${sort}, Total products before sort: ${products.length}`);
    switch(sort) {
      case 'price-low':
        products.sort((a, b) => {
          const priceA = typeof a.price === 'number' ? a.price : parseFloat(a.price) || 0;
          const priceB = typeof b.price === 'number' ? b.price : parseFloat(b.price) || 0;
          return priceA - priceB;
        });
        console.log('Sorted by price (low to high). First 3 prices:', products.slice(0, 3).map(p => p.price));
        break;
      case 'price-high':
        products.sort((a, b) => {
          const priceA = typeof a.price === 'number' ? a.price : parseFloat(a.price) || 0;
          const priceB = typeof b.price === 'number' ? b.price : parseFloat(b.price) || 0;
          return priceB - priceA;
        });
        console.log('Sorted by price (high to low). First 3 prices:', products.slice(0, 3).map(p => p.price));
        break;
      case 'rating':
        products.sort((a, b) => {
          const ratingA = typeof a.rating === 'number' ? a.rating : parseFloat(a.rating) || 0;
          const ratingB = typeof b.rating === 'number' ? b.rating : parseFloat(b.rating) || 0;
          return ratingB - ratingA;
        });
        break;
      case 'newest':
      default:
        products.sort((a, b) => (b._createdAt || 0) - (a._createdAt || 0));
        break;
    }

    // Apply limit AFTER sorting
    products = products.slice(0, parseInt(limit));
    console.log(`Returning ${products.length} products after sorting and limiting`);

    // Remove internal sorting field
    products = products.map(({ _createdAt, ...product }) => product);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching products', 
      error: error.message 
    });
  }
};

/**
 * Get Single Product by ID
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const productDoc = await db.collection('products').doc(id).get();
    
    if (!productDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: { id: productDoc.id, ...productDoc.data() },
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching product', 
      error: error.message 
    });
  }
};

/**
 * Create New Product
 * Admin only - includes AI-generated description option
 */
const createProduct = async (req, res) => {
  try {
    const { name, price, category, stock, image, shortDescription } = req.body;

    // Validate input
    if (!name || !price || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide name, price, and category' 
      });
    }

    // Generate AI description if not provided
    let description = req.body.description;
    if (!description && shortDescription) {
      description = await generateProductDescription(name, category, shortDescription);
    }

    // Create product object
    const productData = {
      name,
      price: parseFloat(price),
      category,
      description: description || shortDescription || '',
      stock: parseInt(stock) || 0,
      image: image || 'https://via.placeholder.com/400',
      rating: 0,
      reviews: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to Firestore
    const productRef = await db.collection('products').add(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { id: productRef.id, ...productData },
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating product', 
      error: error.message 
    });
  }
};

/**
 * Update Product
 * Admin only
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if product exists
    const productDoc = await db.collection('products').doc(id).get();
    
    if (!productDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Update product
    updates.updatedAt = new Date().toISOString();
    await db.collection('products').doc(id).update(updates);

    // Get updated product
    const updatedDoc = await db.collection('products').doc(id).get();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating product', 
      error: error.message 
    });
  }
};

/**
 * Delete Product
 * Admin only
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const productDoc = await db.collection('products').doc(id).get();
    
    if (!productDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Delete product
    await db.collection('products').doc(id).delete();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting product', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
