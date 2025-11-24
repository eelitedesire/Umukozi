require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Admin = require('./models/Admin');
const Service = require('./models/Service');
const SiteSettings = require('./models/SiteSettings');
const CarouselSlide = require('./models/CarouselSlide');
const User = require('./models/User');
const Booking = require('./models/Booking');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection with retry logic
let mongoConnected = false;

async function connectMongoDB() {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries && !mongoConnected) {
        try {
            console.log(`Attempting MongoDB connection (${retryCount + 1}/${maxRetries})...`);
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                maxPoolSize: 10,
                bufferCommands: false,
            });
            mongoConnected = true;
            console.log('✅ Connected to MongoDB');
            return true;
        } catch (err) {
            retryCount++;
            console.error(`❌ MongoDB connection attempt ${retryCount} failed:`, err.message);
            
            if (retryCount < maxRetries) {
                console.log(`⏳ Retrying in 2 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
    
    console.log('🔄 Starting without MongoDB - using fallback data');
    return false;
}

// Monitor connection events
mongoose.connection.on('connected', () => {
    mongoConnected = true;
    console.log('✅ MongoDB reconnected');
});

mongoose.connection.on('disconnected', () => {
    mongoConnected = false;
    console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    mongoConnected = false;
    console.error('❌ MongoDB error:', err.message);
});

// Initial connection
connectMongoDB();

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Fallback data when MongoDB is not available
const fallbackData = {
    settings: {
        siteName: 'ESIGN IMAGE STUDIO',
        siteTitle: 'ESIGN IMAGE STUDIO - Capturing Life\'s Moments',
        logoPath: '/images/WhatsApp Image 2025-10-28 at 15.42.31.jpeg',
        email: 'hello@omikozphotography.com',
        phone: '+1 (555) 123-4567',
        aboutText: 'With years of experience in capturing precious moments...'
    },
    services: [
        { _id: '1', title: 'Photography', description: 'Professional portrait, landscape, and commercial photography', icon: '📷', isActive: true },
        { _id: '2', title: 'Videography', description: 'High-quality video production for all occasions', icon: '🎥', isActive: true },
        { _id: '3', title: 'Event Coverage', description: 'Complete coverage for weddings, parties, and corporate events', icon: '🎉', isActive: true },
        { _id: '4', title: 'Photo Editing', description: 'Professional retouching and enhancement services', icon: '✨', isActive: true }
    ],
    carouselSlides: [],
    admin: {
        email: process.env.ADMIN_EMAIL || 'admin@omikoz.com',
        password: process.env.ADMIN_PASSWORD || 'admin123'
    }
};

// Initialize default admin and settings
async function initializeDefaults() {
    try {
        if (!mongoConnected || mongoose.connection.readyState !== 1) {
            console.log('MongoDB not connected, skipping initialization');
            return;
        }
        
        const adminExists = await Admin.findOne();
        if (!adminExists) {
            await Admin.create({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            console.log('Default admin created');
        }

        const settingsExist = await SiteSettings.findOne();
        if (!settingsExist) {
            await SiteSettings.create({});
            console.log('Default settings created');
        }

        const servicesExist = await Service.findOne();
        if (!servicesExist) {
            await Service.insertMany([
                { title: 'Photography', description: 'Professional portrait, landscape, and commercial photography', icon: '📷' },
                { title: 'Videography', description: 'High-quality video production for all occasions', icon: '🎥' },
                { title: 'Event Coverage', description: 'Complete coverage for weddings, parties, and corporate events', icon: '🎉' },
                { title: 'Photo Editing', description: 'Professional retouching and enhancement services', icon: '✨' }
            ]);
            console.log('Default services created');
        }

        const carouselExists = await CarouselSlide.findOne();
        if (!carouselExists) {
            await CarouselSlide.insertMany([
                { 
                    title: 'Wedding Photography', 
                    subtitle: 'Capturing your special day with elegance',
                    imagePath: 'https://www.ktpress.rw/wp-content/uploads/2019/07/Bertrand.jpg',
                    linkUrl: '/signup',
                    order: 1
                },
                { 
                    title: 'Portrait Sessions', 
                    subtitle: 'Professional headshots & portraits',
                    imagePath: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTV-XMZQ1wSkHHeyBzPsXTMBbs3zrY0oIr3Q&s',
                    linkUrl: '/signup',
                    order: 2
                },
                { 
                    title: 'Event Coverage', 
                    subtitle: 'Corporate & social events',
                    imagePath: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqV3jXUW7KxcCISRfqZTm7OJYMpYaYJDbkOQ&s',
                    linkUrl: '/signup',
                    order: 3
                }
            ]);
            console.log('Default carousel slides created');
        }
    } catch (error) {
        console.log('MongoDB not available, using fallback data');
    }
}

// Auth middleware
const requireAuth = (req, res, next) => {
    if (req.session.adminId) {
        next();
    } else {
        res.redirect('/admin/login');
    }
};

// Public Routes
app.get('/', async (req, res) => {
    try {
        let settings, services, carouselSlides;
        
        if (mongoConnected && mongoose.connection.readyState === 1) {
            settings = await SiteSettings.findOne() || fallbackData.settings;
            services = await Service.find({ isActive: true }).sort({ order: 1 });
            carouselSlides = await CarouselSlide.find({ isActive: true }).sort({ order: 1 });
        } else {
            settings = fallbackData.settings;
            services = fallbackData.services;
            carouselSlides = [];
        }
        
        res.render('index', {
            title: settings.siteTitle || 'ESIGN IMAGE STUDIO - Capturing Life\'s Moments',
            companyName: settings.siteName || 'ESIGN IMAGE STUDIO',
            settings,
            services,
            carouselSlides,
            userId: req.session.userId
        });
    } catch (error) {
        console.error('Error loading homepage:', error);
        res.render('index', {
            title: 'ESIGN IMAGE STUDIO - Capturing Life\'s Moments',
            companyName: 'ESIGN IMAGE STUDIO',
            settings: fallbackData.settings,
            services: fallbackData.services,
            carouselSlides: [],
            userId: req.session.userId
        });
    }
});

app.get('/signup', (req, res) => {
    res.render('signup', {
        title: 'Sign Up - ESIGN IMAGE STUDIO'
    });
});

app.get('/login', (req, res) => {
    res.render('login', { error: req.session.error });
    delete req.session.error;
});

app.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, location } = req.body;
        await User.create({ name, email, password, phone, location });
        req.session.success = 'Account created successfully! Please login.';
        res.redirect('/login');
    } catch (error) {
        req.session.error = 'Registration failed. Email might already exist.';
        res.redirect('/signup');
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user && await user.comparePassword(password)) {
            req.session.userId = user._id;
            res.redirect('/');
        } else {
            req.session.error = 'Invalid credentials';
            res.redirect('/login');
        }
    } catch (error) {
        req.session.error = 'Login error';
        res.redirect('/login');
    }
});

app.get('/book/:serviceId', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    try {
        const service = await Service.findById(req.params.serviceId);
        res.render('book-service', { service });
    } catch (error) {
        res.redirect('/');
    }
});

app.post('/book-service', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    try {
        const { serviceId, bookingDate, notes } = req.body;
        await Booking.create({
            userId: req.session.userId,
            serviceId,
            bookingDate,
            notes
        });
        req.session.success = 'Service booked successfully!';
        res.redirect('/');
    } catch (error) {
        req.session.error = 'Booking failed';
        res.redirect('/');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Admin Routes
app.get('/admin/login', (req, res) => {
    res.render('admin/login', { error: req.session.error });
    delete req.session.error;
});

app.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (mongoConnected && mongoose.connection.readyState === 1) {
            const admin = await Admin.findOne({ email });
            if (admin && await admin.comparePassword(password)) {
                req.session.adminId = admin._id;
                res.redirect('/admin/dashboard');
            } else {
                req.session.error = 'Invalid credentials';
                res.redirect('/admin/login');
            }
        } else {
            // Fallback authentication
            if (email === fallbackData.admin.email && password === fallbackData.admin.password) {
                req.session.adminId = 'fallback-admin';
                res.redirect('/admin/dashboard');
            } else {
                req.session.error = 'Invalid credentials';
                res.redirect('/admin/login');
            }
        }
    } catch (error) {
        req.session.error = 'Login error';
        res.redirect('/admin/login');
    }
});

app.get('/admin/dashboard', requireAuth, async (req, res) => {
    try {
        let settings, services, carouselSlides;
        
        if (mongoConnected && mongoose.connection.readyState === 1) {
            settings = await SiteSettings.findOne() || fallbackData.settings;
            services = await Service.find().sort({ order: 1 });
            carouselSlides = await CarouselSlide.find().sort({ order: 1 });
            const bookings = await Booking.find().populate('userId serviceId').sort({ createdAt: -1 });
            res.render('admin/dashboard', {
                settings,
                services,
                carouselSlides,
                bookings,
                success: req.session.success,
                error: req.session.error,
                mongoConnected: mongoConnected && mongoose.connection.readyState === 1
            });
        } else {
            settings = fallbackData.settings;
            services = fallbackData.services;
            carouselSlides = fallbackData.carouselSlides;
            res.render('admin/dashboard', {
                settings,
                services,
                carouselSlides,
                bookings: [],
                success: req.session.success,
                error: req.session.error,
                mongoConnected: mongoConnected && mongoose.connection.readyState === 1
            });
        }
        

        delete req.session.success;
        delete req.session.error;
    } catch (error) {
        console.error('Dashboard error:', error);
        res.redirect('/admin/login');
    }
});

app.post('/admin/settings', requireAuth, async (req, res) => {
    try {
        await SiteSettings.findOneAndUpdate({}, req.body, { upsert: true });
        req.session.success = 'Settings updated successfully!';
    } catch (error) {
        req.session.error = 'Error updating settings';
    }
    res.redirect('/admin/dashboard');
});

app.post('/admin/services', requireAuth, upload.single('serviceImage'), async (req, res) => {
    try {
        const serviceData = req.body;
        if (req.file) {
            serviceData.imagePath = `/uploads/${req.file.filename}`;
        }
        await Service.create(serviceData);
        req.session.success = 'Service added successfully!';
    } catch (error) {
        req.session.error = 'Error adding service';
    }
    res.redirect('/admin/dashboard');
});

app.post('/admin/services/:id/edit', requireAuth, async (req, res) => {
    try {
        await Service.findByIdAndUpdate(req.params.id, req.body);
        req.session.success = 'Service updated successfully!';
    } catch (error) {
        req.session.error = 'Error updating service';
    }
    res.redirect('/admin/dashboard');
});

app.post('/admin/services/:id/delete', requireAuth, async (req, res) => {
    try {
        await Service.findByIdAndDelete(req.params.id);
        req.session.success = 'Service deleted successfully!';
    } catch (error) {
        req.session.error = 'Error deleting service';
    }
    res.redirect('/admin/dashboard');
});

// Service image upload
app.post('/admin/services/:id/upload-image', requireAuth, upload.single('serviceImage'), async (req, res) => {
    try {
        if (req.file) {
            const imagePath = `/uploads/${req.file.filename}`;
            await Service.findByIdAndUpdate(req.params.id, { imagePath });
            req.session.success = 'Service image uploaded successfully!';
        } else {
            req.session.error = 'No file uploaded';
        }
    } catch (error) {
        req.session.error = 'Error uploading service image';
    }
    res.redirect('/admin/dashboard');
});

// Carousel management routes
app.post('/admin/carousel', requireAuth, upload.single('carouselImage'), async (req, res) => {
    try {
        const { title, subtitle, linkUrl } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : '';
        
        await CarouselSlide.create({
            title,
            subtitle,
            imagePath,
            linkUrl: linkUrl || '/signup'
        });
        req.session.success = 'Carousel slide added successfully!';
    } catch (error) {
        req.session.error = 'Error adding carousel slide';
    }
    res.redirect('/admin/dashboard');
});

app.post('/admin/carousel/:id/edit', requireAuth, upload.single('carouselImage'), async (req, res) => {
    try {
        const updateData = req.body;
        if (req.file) {
            updateData.imagePath = `/uploads/${req.file.filename}`;
        }
        
        await CarouselSlide.findByIdAndUpdate(req.params.id, updateData);
        req.session.success = 'Carousel slide updated successfully!';
    } catch (error) {
        req.session.error = 'Error updating carousel slide';
    }
    res.redirect('/admin/dashboard');
});

app.post('/admin/carousel/:id/delete', requireAuth, async (req, res) => {
    try {
        await CarouselSlide.findByIdAndDelete(req.params.id);
        req.session.success = 'Carousel slide deleted successfully!';
    } catch (error) {
        req.session.error = 'Error deleting carousel slide';
    }
    res.redirect('/admin/dashboard');
});

app.post('/admin/upload-logo', requireAuth, upload.single('logo'), async (req, res) => {
    try {
        if (req.file) {
            const logoPath = `/uploads/${req.file.filename}`;
            await SiteSettings.findOneAndUpdate({}, { logoPath }, { upsert: true });
            req.session.success = 'Logo uploaded successfully!';
        } else {
            req.session.error = 'No file uploaded';
        }
    } catch (error) {
        req.session.error = 'Error uploading logo';
    }
    res.redirect('/admin/dashboard');
});

app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Initialize and start server
initializeDefaults().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Admin panel: http://localhost:${PORT}/admin/login`);
    });
});