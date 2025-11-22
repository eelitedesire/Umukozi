require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function initAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Remove existing admin if any
        await Admin.deleteMany({});
        console.log('Cleared existing admin users');

        // Create new admin with credentials from .env
        const admin = await Admin.create({
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD
        });

        console.log('✅ Admin user created successfully:');
        console.log('Email:', admin.email);
        console.log('Password: admin123 (from .env)');
        
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

initAdmin();