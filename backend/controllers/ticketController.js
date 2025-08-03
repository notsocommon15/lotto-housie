const { pool } = require('../config/database');
const { generateHousieTicket, validateTicket } = require('../utils/ticketGenerator');

const buyTicket = async (req, res) => {
    try {
        const { roomId } = req.body;
        const userId = req.userId;

        // Get room details
        const roomResult = await pool.query(
            'SELECT * FROM rooms WHERE id = $1',
            [roomId]
        );

        if (roomResult.rows.length === 0) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const room = roomResult.rows[0];

        // Check if room is still open for ticket purchases
        if (room.status !== 'waiting') {
            return res.status(400).json({ message: 'Room is no longer accepting tickets' });
        }

        // Check user's wallet balance
        const userResult = await pool.query(
            'SELECT wallet_balance FROM users WHERE id = $1',
            [userId]
        );

        const user = userResult.rows[0];

        if (parseFloat(user.wallet_balance) < parseFloat(room.ticket_price)) {
            return res.status(400).json({ message: 'Insufficient wallet balance' });
        }

        // Check if room is full
        const ticketCountResult = await pool.query(
            'SELECT COUNT(*) as count FROM tickets WHERE room_id = $1',
            [roomId]
        );

        if (parseInt(ticketCountResult.rows[0].count) >= room.max_players) {
            return res.status(400).json({ message: 'Room is full' });
        }

        // Check if user already has a ticket in this room
        const existingTicket = await pool.query(
            'SELECT * FROM tickets WHERE user_id = $1 AND room_id = $2',
            [userId, roomId]
        );

        if (existingTicket.rows.length > 0) {
            return res.status(400).json({ message: 'You already have a ticket in this room' });
        }

        // Generate ticket
        let ticket;
        let attempts = 0;
        do {
            ticket = generateHousieTicket();
            attempts++;
        } while (!validateTicket(ticket) && attempts < 10);

        if (!validateTicket(ticket)) {
            return res.status(500).json({ message: 'Failed to generate valid ticket' });
        }

        // Start transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Deduct money from user's wallet
            await client.query(
                'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
                [room.ticket_price, userId]
            );

            // Create ticket
            const ticketResult = await client.query(
                'INSERT INTO tickets (user_id, room_id, ticket_numbers) VALUES ($1, $2, $3) RETURNING *',
                [userId, roomId, JSON.stringify(ticket)]
            );

            // Create payment record
            await client.query(
                'INSERT INTO payments (user_id, room_id, amount, payment_method, status) VALUES ($1, $2, $3, $4, $5)',
                [userId, roomId, room.ticket_price, 'wallet', 'completed']
            );

            await client.query('COMMIT');

            res.status(201).json({
                message: 'Ticket purchased successfully',
                ticket: {
                    ...ticketResult.rows[0],
                    ticket_numbers: ticket
                }
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Buy ticket error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUserTickets = async (req, res) => {
    try {
        const userId = req.userId;
        const { roomId } = req.query;

        let query = `
      SELECT t.*, r.name as room_name, r.ticket_price, r.status as room_status
      FROM tickets t
      JOIN rooms r ON t.room_id = r.id
      WHERE t.user_id = $1
    `;
        const params = [userId];

        if (roomId) {
            query += ' AND t.room_id = $2';
            params.push(roomId);
        }

        query += ' ORDER BY t.created_at DESC';

        const result = await pool.query(query, params);

        const tickets = result.rows.map(ticket => ({
            ...ticket,
            ticket_numbers: typeof ticket.ticket_numbers === 'string'
                ? JSON.parse(ticket.ticket_numbers)
                : ticket.ticket_numbers
        }));

        res.json({ tickets });
    } catch (error) {
        console.error('Get user tickets error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getTicketDetails = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const userId = req.userId;

        const result = await pool.query(`
      SELECT t.*, r.name as room_name, r.ticket_price, r.status as room_status,
             u.username as organizer_name
      FROM tickets t
      JOIN rooms r ON t.room_id = r.id
      JOIN users u ON r.organizer_id = u.id
      WHERE t.id = $1 AND t.user_id = $2
    `, [ticketId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const ticket = result.rows[0];
        ticket.ticket_numbers = typeof ticket.ticket_numbers === 'string'
            ? JSON.parse(ticket.ticket_numbers)
            : ticket.ticket_numbers;

        // Get current game state
        const gameResult = await pool.query(
            'SELECT called_numbers, current_number FROM games WHERE room_id = $1 AND status = $2',
            [ticket.room_id, 'active']
        );

        const gameState = gameResult.rows[0] || { called_numbers: [], current_number: null };

        res.json({
            ticket,
            gameState
        });
    } catch (error) {
        console.error('Get ticket details error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const checkTicketWin = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const userId = req.userId;
        const { calledNumbers } = req.query; // Get called numbers from query params

        const ticketResult = await pool.query(
            'SELECT * FROM tickets WHERE id = $1 AND user_id = $2',
            [ticketId, userId]
        );

        if (ticketResult.rows.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const ticket = ticketResult.rows[0];
        const ticketNumbers = typeof ticket.ticket_numbers === 'string'
            ? JSON.parse(ticket.ticket_numbers)
            : ticket.ticket_numbers;

        let gameCalledNumbers = [];

        // Use provided called numbers or get from database
        if (calledNumbers) {
            gameCalledNumbers = calledNumbers.split(',').map(n => parseInt(n)).filter(n => !isNaN(n));
        } else {
            // Get current game
            const gameResult = await pool.query(
                'SELECT called_numbers FROM games WHERE room_id = $1 AND status = $2',
                [ticket.room_id, 'active']
            );

            if (gameResult.rows.length === 0) {
                return res.status(400).json({ message: 'No active game found' });
            }

            gameCalledNumbers = gameResult.rows[0].called_numbers || [];
        }

        const winStatus = checkWinConditions(ticketNumbers, gameCalledNumbers);

        res.json({
            winStatus,
            calledNumbers: gameCalledNumbers,
            matchedNumbers: getMatchedNumbers(ticketNumbers, gameCalledNumbers)
        });
    } catch (error) {
        console.error('Check ticket win error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

function checkWinConditions(ticketNumbers, calledNumbers) {
    const wins = [];

    // Count total matched numbers for Early Five
    let totalMatches = 0;
    for (let row of ticketNumbers) {
        for (let num of row) {
            if (num !== 0 && calledNumbers.includes(num)) {
                totalMatches++;
            }
        }
    }

    if (totalMatches >= 5) {
        wins.push('Early Five');
    }

    // Check line wins
    const lineNames = ['Top Line', 'Middle Line', 'Bottom Line'];
    for (let i = 0; i < 3; i++) {
        const row = ticketNumbers[i];
        const rowNumbers = row.filter(num => num !== 0);
        const matchedInRow = rowNumbers.filter(num => calledNumbers.includes(num));

        if (matchedInRow.length === rowNumbers.length) {
            wins.push(lineNames[i]);
        }
    }

    // Check Full House
    let allMatched = true;
    for (let row of ticketNumbers) {
        for (let num of row) {
            if (num !== 0 && !calledNumbers.includes(num)) {
                allMatched = false;
                break;
            }
        }
        if (!allMatched) break;
    }

    if (allMatched) {
        wins.push('Full House');
    }

    return wins;
}

function getMatchedNumbers(ticketNumbers, calledNumbers) {
    const matched = [];
    for (let row = 0; row < ticketNumbers.length; row++) {
        for (let col = 0; col < ticketNumbers[row].length; col++) {
            const num = ticketNumbers[row][col];
            if (num !== 0 && calledNumbers.includes(num)) {
                matched.push({ row, col, number: num });
            }
        }
    }
    return matched;
}

module.exports = {
    buyTicket,
    getUserTickets,
    getTicketDetails,
    checkTicketWin
};