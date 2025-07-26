// models/Appointment.js
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true },
  duration: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
  payment: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Failed'], 
    default: 'Pending' 
  },
  roomId: { type: String, required: true } // Ensure this exists
});

module.exports = mongoose.model('Appointment', appointmentSchema);