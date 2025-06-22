const express = require('express');
const router = express.Router();
const { signup, login, updateProfile, getUserProfile } = require('../controllers/authController');


router.post('/signup', signup);
router.post('/login', login);
router.put('/update-profile/:id', updateProfile);
router.get('/profile/:id', getUserProfile);


module.exports = router;
