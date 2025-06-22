const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  fullName:          { type: String, required: true },
  email:             { type: String, required: true, unique: true, lowercase: true },
  password:          { type: String, required: true },
  gender:            { type: String },
  specialization:    { type: [String] }, // Array of strings
  phoneNumber:       { type: String },
  preferredLanguage: { type: [String] },
  birthdate:         { type: Date },
  profileImageUrl:   { type: String },
  appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }],

}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
