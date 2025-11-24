require('dotenv').config();
const mongoose = require('mongoose');
const SiteSettings = require('./models/SiteSettings');

async function updateSiteSettings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update or create site settings with new site name
        const settings = await SiteSettings.findOneAndUpdate(
            {},
            {
                siteName: 'ESIGN IMAGE STUDIO',
                siteTitle: 'ESIGN IMAGE STUDIO - Capturing Life\'s Moments',
                projectTitle: 'Professional Photography Services'
            },
            { upsert: true, new: true }
        );

        console.log('✅ Site settings updated successfully:');
        console.log('Site Name:', settings.siteName);
        console.log('Site Title:', settings.siteTitle);
        
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

updateSiteSettings();