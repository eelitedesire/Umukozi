const mongoose = require('mongoose');

const carouselSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    imagePath: { type: String, required: true },
    linkUrl: { type: String, default: '/signup' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Carousel', carouselSchema);