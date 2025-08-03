const express = require('express');
const { body } = require('express-validator');
const {
    createRoom,
    getRooms,
    getRoomDetails,
    startGame,
    callNumber,
    endGame
} = require('../controllers/gameController');
const { auth, organizer } = require('../middleware/auth');

const router = express.Router();

// Create room (organizer only)
router.post('/room', [
    auth,
    organizer,
    body('name')
        .isLength({ min: 3, max: 100 })
        .withMessage('Room name must be 3-100 characters long'),
    body('ticketPrice')
        .isFloat({ min: 1 })
        .withMessage('Ticket price must be at least 1'),
    body('maxPlayers')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Max players must be between 1 and 1000')
], createRoom);

// Get all rooms
router.get('/rooms', getRooms);

// Get room details
router.get('/room/:roomId', auth, getRoomDetails);

// Start game (organizer only)
router.post('/room/:roomId/start', auth, organizer, startGame);

// Call number (organizer only)
router.post('/room/:roomId/call-number', auth, organizer, callNumber);

// End game (organizer only)
router.post('/room/:roomId/end', auth, organizer, endGame);

module.exports = router;