const { pool } = require('../config/database');

const createRoom = async (req, res) => {
    try {
        const { name, ticketPrice, maxPlayers = 100 } = req.body;
        const organizerId = req.userId;

        const result = await pool.query(
            'INSERT INTO public.rooms (name, organizer_id, ticket_price, max_players) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, organizerId, ticketPrice, maxPlayers]
        );

        res.status(201).json({
            message: 'Room created successfully',
            room: result.rows[0]
        });
    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getRooms = async (req, res) => {
    try {

        const result = await pool.query(`
      SELECT r.*, u.username as organizer_name,
             COUNT(t.id) as player_count
      FROM public.rooms r
      LEFT JOIN public.users u ON r.organizer_id = u.id
      LEFT JOIN public.tickets t ON r.id = t.room_id
      WHERE r.status IN ('waiting', 'active')
      GROUP BY r.id, u.username
      ORDER BY r.created_at DESC
    `);

        res.json({ rooms: result.rows });
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getRoomDetails = async (req, res) => {
    try {
        const { roomId } = req.params;
        console.log('Fetching room details for roomId:', roomId);
        const roomResult = await pool.query(`
      SELECT r.*, u.username as organizer_name
      FROM public.rooms r
      LEFT JOIN public.users u ON r.organizer_id = u.id
      WHERE r.id = $1
    `, [roomId]);

        if (roomResult.rows.length === 0) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const playersResult = await pool.query(`
      SELECT DISTINCT u.username, t.created_at
      FROM public.tickets t
      JOIN public.users u ON t.user_id = u.id
      WHERE t.room_id = $1
      ORDER BY t.created_at
    `, [roomId]);

        const gameResult = await pool.query(
            'SELECT * FROM public.games WHERE room_id = $1 ORDER BY started_at DESC LIMIT 1',
            [roomId]
        );

        res.json({
            room: roomResult.rows[0],
            players: playersResult.rows,
            game: gameResult.rows[0] || null
        });
    } catch (error) {
        console.error('Get room details error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const startGame = async (req, res) => {
    try {
        const { roomId } = req.params;
        const organizerId = req.userId;

        // Verify organizer
        const roomResult = await pool.query(
            'SELECT * FROM public.rooms WHERE id = $1 AND organizer_id = $2',
            [roomId, organizerId]
        );

        if (roomResult.rows.length === 0) {
            return res.status(403).json({ message: 'Not authorized to start this game' });
        }

        // Check if game already exists
        const existingGame = await pool.query(
            'SELECT * FROM public.games WHERE room_id = $1 AND status = $2',
            [roomId, 'active']
        );

        if (existingGame.rows.length > 0) {
            return res.status(400).json({ message: 'Game already in progress' });
        }

        // Create new game
        const gameResult = await pool.query(
            'INSERT INTO public.games (room_id, called_numbers, status) VALUES ($1, $2, $3) RETURNING *',
            [roomId, [], 'active']
        );

        // Update room status
        await pool.query(
            'UPDATE public.rooms SET status = $1 WHERE id = $2',
            ['active', roomId]
        );

        res.json({
            message: 'Game started successfully',
            game: gameResult.rows[0]
        });
    } catch (error) {
        console.error('Start game error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const callNumber = async (req, res) => {
    try {
        const { roomId } = req.params;
        const organizerId = req.userId;

        // Verify organizer
        const roomResult = await pool.query(
            'SELECT * FROM public.rooms WHERE id = $1 AND organizer_id = $2',
            [roomId, organizerId]
        );

        if (roomResult.rows.length === 0) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Get current game
        const gameResult = await pool.query(
            'SELECT * FROM public.games WHERE room_id = $1 AND status = $2',
            [roomId, 'active']
        );

        if (gameResult.rows.length === 0) {
            return res.status(400).json({ message: 'No active game found' });
        }

        const game = gameResult.rows[0];
        const calledNumbers = game.called_numbers || [];

        // Generate random number not already called
        const availableNumbers = [];
        for (let i = 1; i <= 99; i++) {
            if (!calledNumbers.includes(i)) {
                availableNumbers.push(i);
            }
        }

        if (availableNumbers.length === 0) {
            return res.status(400).json({ message: 'All numbers have been called' });
        }

        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const newNumber = availableNumbers[randomIndex];
        const updatedCalledNumbers = [...calledNumbers, newNumber];

        // Update game
        await pool.query(
            'UPDATE public.games SET called_numbers = $1, current_number = $2 WHERE id = $3',
            [updatedCalledNumbers, newNumber, game.id]
        );

        res.json({
            number: newNumber,
            calledNumbers: updatedCalledNumbers
        });
    } catch (error) {
        console.error('Call number error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const endGame = async (req, res) => {
    try {
        const { roomId } = req.params;
        const organizerId = req.userId;

        // Verify organizer
        const roomResult = await pool.query(
            'SELECT * FROM public.rooms WHERE id = $1 AND organizer_id = $2',
            [roomId, organizerId]
        );

        if (roomResult.rows.length === 0) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update game and room status
        await pool.query(
            'UPDATE public.games SET status = $1 WHERE room_id = $2 AND status = $3',
            ['completed', roomId, 'active']
        );

        await pool.query(
            'UPDATE public.rooms SET status = $1 WHERE id = $2',
            ['completed', roomId]
        );

        res.json({ message: 'Game ended successfully' });
    } catch (error) {
        console.error('End game error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const submitWin = async (req, res) => {
    try {
        const { roomId, ticketId, winType, userId, username, calledNumbers } = req.body;
        const requestUserId = req.userId; // From auth middleware

        // Verify the user owns this ticket
        if (parseInt(userId) !== parseInt(requestUserId)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Get ticket details
        const ticketResult = await pool.query(
            'SELECT * FROM tickets WHERE id = $1 AND user_id = $2 AND room_id = $3',
            [ticketId, userId, roomId]
        );

        if (ticketResult.rows.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const ticket = ticketResult.rows[0];
        const ticketNumbers = typeof ticket.ticket_numbers === 'string' 
            ? JSON.parse(ticket.ticket_numbers) 
            : ticket.ticket_numbers;

        // Get current game
        const gameResult = await pool.query(
            'SELECT * FROM games WHERE room_id = $1 AND status = $2',
            [roomId, 'active']
        );

        if (gameResult.rows.length === 0) {
            return res.status(400).json({ message: 'No active game found' });
        }

        const game = gameResult.rows[0];
        const gameCalledNumbers = game.called_numbers || [];

        // Validate the win server-side
        const isValidWin = validateWin(ticketNumbers, gameCalledNumbers, winType);
        if (!isValidWin) {
            return res.status(400).json({ 
                message: 'Invalid win - win condition not met',
                success: false 
            });
        }

        // Check if this win already exists
        const existingWinResult = await pool.query(
            'SELECT * FROM game_winners WHERE room_id = $1 AND ticket_id = $2 AND win_type = $3',
            [roomId, ticketId, winType]
        );

        if (existingWinResult.rows.length > 0) {
            return res.status(400).json({ 
                message: 'Win already submitted',
                success: false 
            });
        }

        // Start transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Insert into game_winners table
            const winnerResult = await client.query(`
                INSERT INTO game_winners (room_id, game_id, ticket_id, user_id, username, win_type, called_numbers_count, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                RETURNING *
            `, [roomId, game.id, ticketId, userId, username, winType, gameCalledNumbers.length]);

            // Update ticket to mark as winner
            await client.query(
                'UPDATE tickets SET is_winner = TRUE, win_type = COALESCE(win_type, $1) WHERE id = $2',
                [winType, ticketId]
            );

            // Update game winners array
            const currentWinners = game.winners || [];
            const newWinner = {
                id: winnerResult.rows[0].id,
                userId: parseInt(userId),
                username: username,
                winType: winType,
                ticketId: parseInt(ticketId),
                timestamp: new Date().toISOString()
            };
            
            const updatedWinners = [...currentWinners, newWinner];
            
            await client.query(
                'UPDATE games SET winners = $1 WHERE id = $2',
                [JSON.stringify(updatedWinners), game.id]
            );

            await client.query('COMMIT');

            // Emit socket event to notify all clients
            const io = req.app.get('io'); // Assuming you set io in app
            if (io) {
                io.to(roomId.toString()).emit('winner-declared', {
                    roomId: roomId,
                    userId: userId,
                    username: username,
                    winType: winType,
                    ticketId: ticketId,
                    winner: newWinner
                });

                io.to(roomId.toString()).emit('winners-updated', {
                    roomId: roomId,
                    winners: updatedWinners
                });
            }

            res.json({
                success: true,
                message: 'Win submitted successfully',
                winner: newWinner
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Submit win error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            success: false 
        });
    }
};

const claimWin = async (req, res) => {
    // Same logic as submitWin but with different endpoint for manual claims
    return submitWin(req, res);
};

const getRoomWithWinners = async (req, res) => {
    try {
        const { roomId } = req.params;

        // Get room details
        const roomResult = await pool.query(
            'SELECT * FROM rooms WHERE id = $1',
            [roomId]
        );

        if (roomResult.rows.length === 0) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const room = roomResult.rows[0];

        // Get game details with winners
        const gameResult = await pool.query(
            'SELECT * FROM games WHERE room_id = $1 ORDER BY created_at DESC LIMIT 1',
            [roomId]
        );

        let game = null;
        let winners = [];

        if (gameResult.rows.length > 0) {
            game = gameResult.rows[0];
            
            // Get winners from database
            const winnersResult = await pool.query(`
                SELECT gw.*, u.username 
                FROM game_winners gw
                JOIN users u ON gw.user_id = u.id
                WHERE gw.room_id = $1
                ORDER BY gw.created_at ASC
            `, [roomId]);

            winners = winnersResult.rows.map(winner => ({
                id: winner.id,
                userId: winner.user_id,
                username: winner.username,
                winType: winner.win_type,
                ticketId: winner.ticket_id,
                timestamp: winner.created_at,
                calledNumbersCount: winner.called_numbers_count
            }));

            // Update game object with current winners
            game.winners = winners;
        }

        res.json({
            room,
            game,
            winners
        });

    } catch (error) {
        console.error('Get room with winners error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper function to validate wins server-side
function validateWin(ticketNumbers, calledNumbers, winType) {
    switch (winType) {
        case 'Early Five':
            let matchCount = 0;
            for (let row of ticketNumbers) {
                for (let num of row) {
                    if (num !== 0 && calledNumbers.includes(num)) {
                        matchCount++;
                    }
                }
            }
            return matchCount >= 5;

        case 'Top Line':
        case 'Middle Line':
        case 'Bottom Line':
            const rowIndex = winType === 'Top Line' ? 0 : winType === 'Middle Line' ? 1 : 2;
            const row = ticketNumbers[rowIndex];
            const rowNumbers = row.filter(num => num !== 0);
            const matchedInRow = rowNumbers.filter(num => calledNumbers.includes(num));
            return matchedInRow.length === rowNumbers.length;

        case 'Full House':
            for (let row of ticketNumbers) {
                for (let num of row) {
                    if (num !== 0 && !calledNumbers.includes(num)) {
                        return false;
                    }
                }
            }
            return true;

        default:
            return false;
    }
};

module.exports = {
    createRoom,
    getRooms,
    getRoomDetails,
    startGame,
    callNumber,
    endGame
};