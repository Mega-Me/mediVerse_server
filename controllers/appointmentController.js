const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

exports.getAppointmentsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const appointments = await Appointment.find({ userId })
      .populate('doctor', 'fullName specialization') // include doctor info
      .sort({ date: -1 });

    res.status(200).json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.createAppointment = async (req, res) => {
  try {
    const { userId, doctorId, date, duration, status = 'Pending', payment = 'Pending' } = req.body;

    const appointment = new Appointment({
      userId,
      doctor: doctorId,
      date,
      duration,
      status,
      payment,
    });

    const saved = await appointment.save();

    await User.findByIdAndUpdate(userId, { $push: { appointments: saved._id } });
    await Doctor.findByIdAndUpdate(doctorId, { $push: { appointments: saved._id } });

    res.status(201).json({ message: 'Appointment created', appointment: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

