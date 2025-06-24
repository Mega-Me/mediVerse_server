const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

router.post('/', appointmentController.createAppointment);
router.get('/user/:userId', appointmentController.getAppointmentsByUser);
router.get('/doctor/:id', appointmentController.getAppointmentsForDoctor); 


module.exports = router;
