import dotenv from 'dotenv';
dotenv.config();

import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // fallback
}

import mongoose from 'mongoose';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Seed] Connected to MongoDB Atlas...');

    // Clear existing collections
    await User.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    console.log('[Seed] Cleared old collections...');

    // 1. Create Users
    const adminUser = await User.create({
      name: 'Miralou Admin',
      email: 'admin@miralou.com',
      password: 'password123',
      role: 'admin',
    });

    const regularUser = await User.create({
      name: 'Kabya Ahmed',
      email: 'kabya@example.com',
      password: 'password123',
      role: 'user',
    });

    console.log('[Seed] Users created (Admin: admin@miralou.com / password123)');

    // 2. Create Streetwear Products (Men, Women, Kids)
    const products = [
      {
        title: 'CYBER-RUNNER V3 "PHANTOM BLACK"',
        description: 'Deconstructed upper engineered from military-grade ballistic nylon and premium calfskin suede. Chunky EVA exaggerated tread outsole for urban asphalt grip.',
        price: 14500,
        category: 'men',
        stock: 25,
        images: [
          'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=900',
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=900',
        ],
        sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'],
        colors: ['Phantom Black', 'Gunmetal Grey'],
        featured: true,
      },
      {
        title: 'NIGHTHAWK MID STRIKE "ACID VOLT"',
        description: 'Mid-cut silhouette featuring architectural TPU cage structure, quick-draw toggle lacing system, and crimson shock-absorption air unit.',
        price: 12200,
        category: 'women',
        stock: 18,
        images: [
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=900',
        ],
        sizes: ['EU 37', 'EU 38', 'EU 39', 'EU 40'],
        colors: ['Acid Volt', 'Onyx Black'],
        featured: true,
      },
      {
        title: 'APEX DRIFT "MONOCHROME GLITCH"',
        description: 'Low-profile avant-garde runner designed in collaboration with Tokyo underground stylists. Breathable jacquard knit upper with 3M reflective side banding.',
        price: 16800,
        category: 'men',
        stock: 12,
        images: [
          'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&q=80&w=900',
        ],
        sizes: ['EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45'],
        colors: ['Glitch White', 'Matte Carbon'],
        featured: true,
      },
      {
        title: 'NEO-LOW MATRIX "CRIMSON CORE"',
        description: 'Minimalist skate-ready streetwear sneaker crafted with vulcanized dual-density cupsole and premium distressed nubuck leather in blood-red accents.',
        price: 9500,
        category: 'kids',
        stock: 30,
        images: [
          'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=900',
        ],
        sizes: ['EU 34', 'EU 35', 'EU 36', 'EU 37'],
        colors: ['Crimson Core', 'Stealth Charcoal'],
        featured: true,
      },
      {
        title: 'VORTEX OBLIVION "OBSIDIAN"',
        description: 'Futuristic chunky silhouette with layered leather paneling and sculptural rubber soles. An uncompromising statement piece for fashion purists.',
        price: 18900,
        category: 'men',
        stock: 14,
        images: [
          'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&q=80&w=900',
        ],
        sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43'],
        colors: ['Obsidian Black'],
        featured: false,
      },
      {
        title: 'ECLIPSE HYPER-LO "GHOST WHITE"',
        description: 'Ultra-lightweight sculpted platform sneakers featuring transparent rubber pods and ergonomic memory-foam inner sole.',
        price: 13400,
        category: 'women',
        stock: 22,
        images: [
          'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&q=80&w=900',
        ],
        sizes: ['EU 36', 'EU 37', 'EU 38', 'EU 39', 'EU 40'],
        colors: ['Ghost White', 'Silver Metallic'],
        featured: false,
      },
      {
        title: 'MINI-STRIKER STREET JUNIOR',
        description: 'Reinforced toe bumper and high-traction rubber soles built for durable all-day movement and youth streetwear attitude.',
        price: 7800,
        category: 'kids',
        stock: 40,
        images: [
          'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&q=80&w=900',
        ],
        sizes: ['EU 32', 'EU 33', 'EU 34', 'EU 35'],
        colors: ['Pitch Black', 'Red Strike'],
        featured: false,
      },
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`[Seed] Seeded ${createdProducts.length} streetwear products!`);

    // 3. Create Sample Order
    await Order.create({
      userId: regularUser._id,
      items: [
        {
          product: createdProducts[0]._id,
          title: createdProducts[0].title,
          quantity: 1,
          price: createdProducts[0].price,
          selectedSize: 'EU 42',
          image: createdProducts[0].images[0],
        },
      ],
      totalAmount: createdProducts[0].price + 120,
      shippingAddress: {
        fullName: 'Kabya Ahmed',
        phone: '01711223344',
        district: 'Dhaka',
        thana: 'Gulshan',
        fullAddress: 'Road 11, Block D, House 42, Gulshan-1',
      },
      paymentStatus: 'Paid',
      deliveryStatus: 'Processing',
      transactionId: 'TXN_1791391593',
      paymentGatewayResponse: {
        status: 'VALID',
        bank_tran_id: '15112022013000',
        card_type: 'BKASH-bKash',
      },
    });

    console.log('[Seed] Seeded initial sample order for Admin Dashboard visualization.');
    console.log('[Seed] Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedData();
