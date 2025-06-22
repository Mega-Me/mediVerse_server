const Doctor = require('../models/Doctor');
const bcrypt = require('bcryptjs');

exports.createDoctor = async (req, res) => {
  try {
    const {
      fullName, email, password, gender,
      specialization, phoneNumber, preferredLanguage,
      birthdate, profileImageUrl
    } = req.body;

    const existing = await Doctor.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Doctor already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const doctor = new Doctor({
      fullName,
      email,
      password: hashedPassword,
      gender,
      specialization,
      phoneNumber,
      preferredLanguage,
      birthdate,
      profileImageUrl,
    });

    await doctor.save();

    res.status(201).json({
      message: 'Doctor created successfully',
      doctor: {
        id: doctor._id,
        fullName: doctor.fullName,
        email: doctor.email,
        specialization: doctor.specialization
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().select('-password');
    res.json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

//filter doctors by specializations
exports.getDoctorsBySpecializations = async (req, res) => {
  try {
    const { specializations } = req.body;

    if (!Array.isArray(specializations) || specializations.length === 0) {
      return res.status(400).json({ message: 'Specializations must be a non-empty array' });
    }

    const doctors = await Doctor.find({
      specialization: { $in: specializations }
    }).select('-password');

    res.json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

//filter doctors by preferred language
exports.getDoctorsByLanguages = async (req, res) => {
  try {
    const { languages } = req.body;

    if (!Array.isArray(languages) || languages.length === 0) {
      return res.status(400).json({ message: 'Languages must be a non-empty array' });
    }

    const doctors = await Doctor.find({
      preferredLanguage: { $in: languages }
    }).select('-password');

    res.json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.filterDoctors = async (req, res) => {
  try {
    const { specializations, languages } = req.body;

    if ((!Array.isArray(specializations) || specializations.length === 0) &&
        (!Array.isArray(languages) || languages.length === 0)) {
      return res.status(400).json({ message: 'At least one filter must be provided' });
    }

    const query = {};
    if (Array.isArray(specializations) && specializations.length > 0) {
      query.specialization = { $in: specializations };
    }
    if (Array.isArray(languages) && languages.length > 0) {
      query.preferredLanguage = { $in: languages };
    }

    const doctors = await Doctor.find(query).select('-password');
    res.json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

//filter doctors by gender
exports.getDoctorsByGenderAndLanguage = async (req, res) => {
  try {
    const { gender, languages } = req.body;

    if (!gender || !Array.isArray(languages) || languages.length === 0) {
      return res.status(400).json({ message: 'Gender and languages are required' });
    }

    const doctors = await Doctor.find({
      gender,
      preferredLanguage: { $in: languages },
    }).select('-password');

    res.json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
