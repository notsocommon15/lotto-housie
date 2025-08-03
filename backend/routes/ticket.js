const express = require('express');
const { body } = require('express-validator');
const {
    buyTicket,
    getUserTickets,
    getTicketDetails,
    checkTicketWin
} = require('../controllers/ticketController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Buy ticket
router.post('/buy', [
    auth,
    body('roomId')
        .isInt({ min: 1 })
        .withMessage('Valid room ID is required')
], buyTicket);

// Get user tickets
router.get('/my-tickets', auth, getUserTickets);

// Get ticket details
router.get('/:ticketId', auth, getTicketDetails);

// Check ticket win status
router.get('/:ticketId/check-win', auth, checkTicketWin);

module.exports = router;