const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
    siteName: { type: String, default: 'Omikoz Photography' },
    siteTitle: { type: String, default: 'Omikoz Photography - Capturing Life\'s Moments' },
    projectTitle: { type: String, default: 'Professional Photography Services' },
    heroTitle: { type: String, default: 'Capturing Life\'s Beautiful Moments' },
    heroSubtitle: { type: String, default: 'Professional photography that tells your story' },
    logoPath: { type: String, default: '/images/WhatsApp Image 2025-10-28 at 15.42.31.jpeg' },
    email: { type: String, default: 'hello@omikozphotography.com' },
    phone: { type: String, default: '+1 (555) 123-4567' },
    aboutText: { type: String, default: 'With years of experience in capturing precious moments...' }
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);