const express = require('express');
const { body } = require('express-validator');
const { register, login, getProfile } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be 3-50 characters long')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('role')
        .optional()
        .isIn(['player', 'organizer'])
        .withMessage('Role must be either player or organizer')
], register);

// Login
router.post('/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
], login);

// Get user profile
router.get('/profile', auth, getProfile);

module.exports = router;