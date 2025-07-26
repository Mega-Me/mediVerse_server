const Appointment = require('../models/appointment');
const crypto = require('crypto');

// Generate unique room ID
const generateRoomId = () => `room_${crypto.randomBytes(8).toString('hex')}`;

// Create appointment
exports.createAppointment = async (req, res) => {
  try {
    const roomId = generateRoomId();
    const appointment = new Appointment({ ...req.body, roomId });
    await appointment.save();
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get appointment by ID
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};