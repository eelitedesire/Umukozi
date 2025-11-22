#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Service = require('./models/Service');
const SiteSettings = require('./models/SiteSettings');

console.log('🚀 Setting up local MongoDB database...');

async function setupDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Clear existing data (optional)
        console.log('🧹 Clearing existing data...');
        await Admin.deleteMany({});
        await Service.deleteMany({});
        await SiteSettings.deleteMany({});
        
        // Create default admin
        console.log('👤 Creating default admin...');
        await Admin.create({
            email: process.env.ADMIN_EMAIL || 'admin@omikoz.com',
            password: process.env.ADMIN_PASSWORD || 'admin123'
        });
        
        // Create default settings
        console.log('⚙️ Creating default settings...');
        await SiteSettings.create({
            siteName: 'Omikoz Photography',
            siteTitle: 'Omikoz Photography - Capturing Life\'s Moments',
            logoPath: '/images/WhatsApp Image 2025-10-28 at 15.42.31.jpeg',
            email: 'hello@omikozphotography.com',
            phone: '+1 (555) 123-4567',
            aboutText: 'With years of experience in capturing precious moments, we specialize in creating beautiful memories that last a lifetime.'
        });
        
        // Create default services
        console.log('🛠️ Creating default services...');
        await Service.insertMany([
            { 
                title: 'Photography', 
                description: 'Professional portrait, landscape, and commercial photography', 
                icon: '📷',
                isActive: true 
            },
            { 
                title: 'Videography', 
                description: 'High-quality video production for all occasions', 
                icon: '🎥',
                isActive: true 
            },
            { 
                title: 'Event Coverage', 
                description: 'Complete coverage for weddings, parties, and corporate events', 
                icon: '🎉',
                isActive: true 
            },
            { 
                title: 'Photo Editing', 
                description: 'Professional retouching and enhancement services', 
                icon: '✨',
                isActive: true 
            }
        ]);
        
        console.log('🎉 Database setup completed successfully!');
        console.log('📋 Summary:');
        console.log(`   Admin email: ${process.env.ADMIN_EMAIL || 'admin@omikoz.com'}`);
        console.log(`   Admin password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
        console.log('   Services: 4 default services created');
        console.log('   Settings: Default site settings created');
        
        await mongoose.disconnect();
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

setupDatabase();