const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const crypto = require('crypto');

exports.getAppointmentsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const appointments = await Appointment.find({ userId })
      .populate('doctor', 'fullName specialization') 
      .sort({ date: -1 });

    // Map appointments to include roomId
    const response = appointments.map(appt => ({
      ...appt._doc,
      roomId: appt.roomId // Ensure roomId is explicitly included
    }));

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



exports.createAppointment = async (req, res) => {
  try {
    const { userId, doctorId, date, duration, status = 'Pending', payment = 'Pending' } = req.body;

    // Generate unique room ID
    const roomId = `room_${crypto.randomBytes(8).toString('hex')}`;

    const appointment = new Appointment({
      userId,
      doctor: doctorId,
      date,
      duration,
      status,
      payment,
      roomId, // Add roomId here
    });

    const saved = await appointment.save();

    await User.findByIdAndUpdate(userId, { $push: { appointments: saved._id } });
    await Doctor.findByIdAndUpdate(doctorId, { $push: { appointments: saved._id } });

    res.status(201).json({ 
      message: 'Appointment created', 
      appointment: saved 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAppointmentsForDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const appointments = await Appointment.find({ doctor: id })
      .populate('userId', 'fullName')
      .sort({ date: 1 });

    // Map appointments to include roomId
    const response = appointments.map(appt => ({
      ...appt._doc,
      roomId: appt.roomId // Ensure roomId is explicitly included
    }));

    res.status(200).json(response);
  } catch (err) {
    console.error('Doctor appointment fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
