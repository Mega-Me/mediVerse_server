const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      // Do NOT set age, gender, etc. here
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, fullName: user.fullName, preferredLanguage:user.preferredLanguage } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      birthdate,
      gender,
      preferredLanguage,
      phoneNumber,
      age
    } = req.body;

    if (!birthdate || !gender || !preferredLanguage)
      return res.status(400).json({ message: 'Birthdate, gender, and preferred language are required' });

    const updateData = {
      birthdate: new Date(birthdate),
      gender,
      preferredLanguage,
    };

    if (req.body.phoneNumber) updateData.phoneNumber = phoneNumber;
    if (req.body.age) updateData.age = age;
    if (req.body.profileImageUrl) updateData.profileImageUrl = req.body.profileImageUrl;

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

    return res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        birthdate: updatedUser.birthdate,
        gender: updatedUser.gender,
        preferredLanguage: updatedUser.preferredLanguage,
        phoneNumber: updatedUser.phoneNumber,
        age: updatedUser.age,
        profileImageUrl: updatedUser.profileImageUrl,
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate({
        path: 'appointments',
        populate: { path: 'doctor', select: 'fullName specialization' }
      });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


