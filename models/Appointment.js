const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true },
  duration: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Cancelled', 'Completed'], default: 'Pending' },
  payment: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
