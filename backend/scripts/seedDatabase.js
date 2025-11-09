// Database Seeding Script
// Run this script to populate Firestore with sample products
// Usage: node scripts/seedDatabase.js

require('dotenv').config();
const { db } = require('../config/firebase');
const sampleProducts = require('../utils/sampleData');
const fileProducts = (() => {
  try {
    return require('../sample-data/products.json');
  } catch (e) {
    console.warn('No additional file-based products found:', e.message);
    return [];
  }
})();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Merge product sources (utils + file-based)
    const merged = [...sampleProducts, ...fileProducts];
    console.log(`Adding ${merged.length} products...`);
    for (const product of merged) {
      const productData = {
        name: product.name,
        price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
        category: product.category || 'General',
        description: product.description || '',
        stock: Number.isFinite(product.stock) ? product.stock : 100,
        image: product.image || 'https://via.placeholder.com/400',
        rating: Number.isFinite(product.rating) ? product.rating : 4.5,
        reviews: Number.isFinite(product.reviews) ? product.reviews : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const docRef = await db.collection('products').add(productData);
      console.log(`✅ Added: ${product.name} (ID: ${docRef.id})`);
    }

    console.log(`\n✨ Successfully added ${merged.length} products!`);
    console.log('\n🎉 Database seeding completed!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
