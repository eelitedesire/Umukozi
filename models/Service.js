const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: '📷' },
    imagePath: { type: String, default: '' },
    price: { type: String, default: '' },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);