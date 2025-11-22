const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
    bookingDate: { type: Date, required: true },
    notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);