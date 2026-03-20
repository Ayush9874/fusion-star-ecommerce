require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');

const products = [
  {
    name: 'Apple iPhone 15 Pro (128 GB) - Natural Titanium',
    description: 'Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and an even more versatile Pro camera system.',
    price: 134900, originalPrice: 144900, category: 'Electronics', stock: 45, brand: 'Apple',
    isFeatured: true, rating: 4.8, numReviews: 1280,
    images: [{ url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=600', alt: 'iPhone 15 Pro' }],
  },
  {
    name: 'Samsung Galaxy S24 Ultra 5G AI Smartphone',
    description: 'Welcome to the era of mobile AI. With Galaxy S24 Ultra in your hands, you can unleash whole new levels of creativity.',
    price: 129999, originalPrice: 134999, category: 'Electronics', stock: 30, brand: 'Samsung',
    isFeatured: true, rating: 4.7, numReviews: 890,
    images: [{ url: 'https://images.unsplash.com/photo-1707327311394-b2ccb9d14ea1?auto=format&fit=crop&q=80&w=600', alt: 'Samsung Galaxy' }],
  },
  {
    name: 'Sony Bravia 164 cm (65 inches) 4K Ultra HD Smart LED TV',
    description: 'Experience the thrill of movies and games in intensely detailed 4K HDR. Everything you watch becomes more lifelike.',
    price: 74990, originalPrice: 139900, category: 'Electronics', stock: 20, brand: 'Sony',
    isFeatured: true, rating: 4.6, numReviews: 457,
    images: [{ url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=600', alt: 'Sony TV' }],
  },
  {
    name: 'Puma Men\'s Running Shoes',
    description: 'Breathable mesh upper with EVA midsole for lightweight cushioning. SoftFoam+ sockliner provides superior comfort.',
    price: 1899, originalPrice: 3499, category: 'Sports', stock: 160, brand: 'Puma',
    isFeatured: false, rating: 4.3, numReviews: 2204,
    images: [{ url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=600', alt: 'Running Shoes' }],
  },
  {
    name: 'Allen Solly Men\'s Polo T-Shirt',
    description: 'Solid regular fit polo neck cotton t-shirt. Ideal for casual wear or Friday office wear.',
    price: 749, originalPrice: 1299, category: 'Clothing', stock: 250, brand: 'Allen Solly',
    isFeatured: false, rating: 4.1, numReviews: 3312,
    images: [{ url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=600', alt: 'Polo T-Shirt' }],
  },
  {
    name: 'Prestige Iris 750 Watt Mixer Grinder',
    description: '3 stainless steel jars and 1 juicer jar. Powerful 750W motor for tough grinding tasks.',
    price: 3299, originalPrice: 6295, category: 'Home & Kitchen', stock: 85, brand: 'Prestige',
    isFeatured: true, rating: 4.0, numReviews: 5476,
    images: [{ url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&q=80&w=600', alt: 'Mixer Grinder' }],
  },
  {
    name: 'Atomic Habits by James Clear',
    description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones. Over 10 million copies sold.',
    price: 540, originalPrice: 799, category: 'Books', stock: 500, brand: 'Penguin',
    isFeatured: false, rating: 4.8, numReviews: 14543,
    images: [{ url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600', alt: 'Atomic Habits Book' }],
  },
  {
    name: 'boAt Stone 1000 14W Bluetooth Speaker',
    description: '14W RMS Stereo Output, IPX5 Water Resistance, and up to 8 hours of playtime.',
    price: 1999, originalPrice: 6990, category: 'Electronics', stock: 155, brand: 'boAt',
    isFeatured: true, rating: 4.4, numReviews: 12167,
    images: [{ url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=600', alt: 'boAt Speaker' }],
  },
  {
    name: 'Boldfit Yoga Mat for Gym and Workout',
    description: 'Anti-slip NBR material, 6mm thickness, perfect for men & women workouts at home.',
    price: 599, originalPrice: 1500, category: 'Sports', stock: 180, brand: 'Boldfit',
    isFeatured: false, rating: 4.2, numReviews: 4231,
    images: [{ url: 'https://images.unsplash.com/photo-1601925228008-4e63f0076e1a?auto=format&fit=crop&q=80&w=600', alt: 'Yoga Mat' }],
  },
  {
    name: 'Milton Thermosteel 1000ml Flask',
    description: 'Vacuum insulated flask that keeps drinks hot or cold for 24 hours. Made with 18/8 stainless steel.',
    price: 980, originalPrice: 1225, category: 'Home & Kitchen', stock: 320, brand: 'Milton',
    isFeatured: false, rating: 4.5, numReviews: 8891,
    images: [{ url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=600', alt: 'Milton Flask' }],
  },
  {
    name: 'Minimalist 10% Vitamin C Face Serum',
    description: 'Highly stable Vitamin C serum for glowing skin and reducing pigmentation.',
    price: 664, originalPrice: 699, category: 'Beauty', stock: 140, brand: 'Minimalist',
    isFeatured: true, rating: 4.3, numReviews: 6445,
    images: [{ url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600', alt: 'Vitamin C Serum' }],
  },
  {
    name: 'HP Pavilion 14, 12th Gen Intel Core i5',
    description: '16GB RAM, 512GB SSD, 14-inch IPS Micro-Edge FHD Display, Windows 11, Backlit KB.',
    price: 64990, originalPrice: 78599, category: 'Electronics', stock: 25, brand: 'HP',
    isFeatured: false, rating: 4.4, numReviews: 1302,
    images: [{ url: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&q=80&w=600', alt: 'HP Laptop' }],
  },
];

const seedDB = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    await User.create({
      name: 'Admin User',
      email: 'admin@fusionstar.com',
      password: 'admin123',
      role: 'admin',
    });

    // Create sample user
    await User.create({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
      role: 'user',
    });

    // Insert products
    await Product.insertMany(products);

    console.log('✅ Seed complete!');
    console.log('   Admin: admin@fusionstar.com / admin123');
    console.log('   User:  jane@example.com / password123');
    console.log(`   ${products.length} products added`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDB();
