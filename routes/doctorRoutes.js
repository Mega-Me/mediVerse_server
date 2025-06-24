const express = require('express');
const router = express.Router();

const { getAppointmentsForDoctor } = require('../controllers/appointmentController');


const {
  createDoctor,
  getAllDoctors,
  getDoctorsBySpecializations,
  getDoctorsByLanguages,
  filterDoctors,
  getDoctorsByGenderAndLanguage
} = require('../controllers/doctorController');

router.post('/', createDoctor);
router.get('/', getAllDoctors);
router.post('/filter', getDoctorsBySpecializations); 
router.post('/filter-languages', getDoctorsByLanguages);
router.post('/filter-gender-language', getDoctorsByGenderAndLanguage);
router.post('/filter', filterDoctors);
router.get('/appointments/doctor/:id', getAppointmentsForDoctor);



module.exports = router;
