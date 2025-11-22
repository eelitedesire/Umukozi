#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 MongoDB Connection Diagnostics');
console.log('================================');
console.log(`📍 MONGODB_URI: ${process.env.MONGODB_URI}`);
console.log(`🌐 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log('');

async function checkConnection() {
    try {
        console.log('⏳ Testing MongoDB connection...');
        
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ MongoDB connection successful!');
        console.log(`📊 Connection state: ${mongoose.connection.readyState}`);
        console.log(`🏠 Database name: ${mongoose.connection.name}`);
        console.log(`🖥️  Host: ${mongoose.connection.host}`);
        console.log(`🔌 Port: ${mongoose.connection.port}`);
        
        // Test a simple operation
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📁 Collections found: ${collections.length}`);
        
        await mongoose.disconnect();
        console.log('🔌 Disconnected successfully');
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:');
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${error.code}`);
        
        if (error.code === 'ENOTFOUND') {
            console.log('');
            console.log('🔧 Troubleshooting suggestions:');
            console.log('   1. Check if MongoDB is running locally');
            console.log('   2. Verify the connection string in .env file');
            console.log('   3. For Atlas: Check network access and credentials');
            console.log('   4. Try: brew services start mongodb-community');
        }
    }
}

checkConnection();