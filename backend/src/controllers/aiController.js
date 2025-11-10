// AI Controller
// Handles AI-powered product recommendations and descriptions

const { db, admin } = require('../../config/firebase');
const { getProductRecommendations, generateProductDescription } = require('../services/aiService');
const sampleProducts = require('../../utils/sampleData');

/**
 * Get Product Recommendations
 * Returns personalized product recommendations based on user browsing and purchase history
 * Works with or without authentication
 */
const getRecommendations = async (req, res) => {
  try {
    const { productId, limit = 8, category } = req.query;
    const userId = req.user?.uid;
    let userData = null;

    // Fallback path when Firestore is not configured
    if (!db) {
      let products = sampleProducts.map((p, idx) => ({ id: p.id || `sample-${idx + 1}`, ...p }));
      if (category && category !== 'all') {
        products = products.filter(p => p.category === category);
      }
      const recs = await getProductRecommendations(products, null, productId, parseInt(limit) || 8);
      return res.status(200).json({ success: true, count: recs.length, data: recs.slice(0, parseInt(limit) || 8) });
    }

    // Get user data if authenticated
    if (userId) {
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          userData = userDoc.data();
          
          // Update user browsing history
          if (productId) {
            await db.collection('users').doc(userId).update({
              browsing_history: admin.firestore.FieldValue.arrayUnion(productId),
            });
          }
        }
      } catch (userError) {
        console.log('User data not available, using general recommendations');
      }
    }

    // Get all products
    let productsRef = db.collection('products');
    
    // If category is provided, filter by category
    if (category && category !== 'all') {
      productsRef = productsRef.where('category', '==', category);
    }
    
    const productsSnapshot = await productsRef.limit(100).get();
    const allProducts = [];
    productsSnapshot.forEach(doc => {
      allProducts.push({ id: doc.id, ...doc.data() });
    });

    // If we have user data, try AI recommendations
    let recommendations = [];
    if (userData && allProducts.length > 0) {
      try {
        recommendations = await getProductRecommendations(
          allProducts,
          userData,
          productId,
          parseInt(limit)
        );
      } catch (aiError) {
        console.log('AI service error, using fallback:', aiError.message);
      }
    }

    // Fallback: If no AI recommendations or not enough, use smart recommendations
    if (recommendations.length < parseInt(limit)) {
      let fallbackProducts = [...allProducts];
      
      // Exclude current product if productId provided
      if (productId) {
        fallbackProducts = fallbackProducts.filter(p => p.id !== productId);
      }
      
      // If we have a productId, prioritize same category
      if (productId && fallbackProducts.length > 0) {
        const currentProduct = allProducts.find(p => p.id === productId);
        if (currentProduct?.category) {
          const sameCategory = fallbackProducts.filter(p => p.category === currentProduct.category);
          const otherProducts = fallbackProducts.filter(p => p.category !== currentProduct.category);
          fallbackProducts = [...sameCategory, ...otherProducts];
        }
      }
      
      // Sort by rating and reviews (best sellers)
      fallbackProducts.sort((a, b) => {
        const aScore = (a.rating || 0) * (a.reviews || 0);
        const bScore = (b.rating || 0) * (b.reviews || 0);
        return bScore - aScore;
      });
      
      // Get top products
      const needed = parseInt(limit) - recommendations.length;
      const fallback = fallbackProducts.slice(0, needed);
      
      // Merge AI recommendations with fallback
      const existingIds = new Set(recommendations.map(r => r.id));
      recommendations = [
        ...recommendations,
        ...fallback.filter(p => !existingIds.has(p.id))
      ];
    }

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations.slice(0, parseInt(limit)),
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching recommendations', 
      error: error.message 
    });
  }
};

/**
 * Generate AI Product Description
 * Creates SEO-friendly product description using AI
 */
const generateDescription = async (req, res) => {
  try {
    const { name, category, shortDescription } = req.body;

    // Validate input
    if (!name || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product name and category are required' 
      });
    }

    // Generate description
    const description = await generateProductDescription(name, category, shortDescription);

    res.status(200).json({
      success: true,
      data: {
        description,
      },
    });
  } catch (error) {
    console.error('Generate description error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating description', 
      error: error.message 
    });
  }
};

module.exports = {
  getRecommendations,
  generateDescription,
};
