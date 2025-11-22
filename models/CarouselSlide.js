const mongoose = require('mongoose');

const carouselSlideSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    imagePath: { type: String, required: true },
    linkUrl: { type: String, default: '/signup' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('CarouselSlide', carouselSlideSchema);