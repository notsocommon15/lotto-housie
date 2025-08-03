const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const ticketRoutes = require('./routes/ticket');
const { pool } = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/ticket', ticketRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('leave-room', (roomId) => {
        socket.leave(roomId);
        console.log(`User ${socket.id} left room ${roomId}`);
    });

    socket.on('call-number', async (data) => {
        const { roomId, number, calledNumbers } = data;

        try {
            // Update game in database
            await pool.query(
                'UPDATE games SET called_numbers = $1, current_number = $2 WHERE room_id = $3',
                [calledNumbers, number, roomId]
            );

            // Broadcast to all users in room
            io.to(roomId).emit('number-called', {
                number,
                calledNumbers
            });

            // Check for winners
            const winners = await checkWinners(roomId, calledNumbers);
            if (winners.length > 0) {
                io.to(roomId).emit('winners-found', winners);
            }
        } catch (error) {
            console.error('Error calling number:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

async function checkWinners(roomId, calledNumbers) {
    try {
        const result = await pool.query(
            'SELECT * FROM tickets WHERE room_id = $1 AND is_winner = FALSE',
            [roomId]
        );

        const winners = [];

        for (const ticket of result.rows) {
            const ticketNumbers = ticket.ticket_numbers;

            // Check Early Five
            if (calledNumbers.length >= 5) {
                let matchCount = 0;
                for (let row of ticketNumbers) {
                    for (let num of row) {
                        if (num !== 0 && calledNumbers.includes(num)) {
                            matchCount++;
                        }
                    }
                }
                if (matchCount >= 5) {
                    winners.push({
                        ticketId: ticket.id,
                        userId: ticket.user_id,
                        winType: 'Early Five'
                    });
                }
            }

            // Check line wins
            for (let i = 0; i < 3; i++) {
                const row = ticketNumbers[i];
                const rowNumbers = row.filter(num => num !== 0);
                const matchedInRow = rowNumbers.filter(num => calledNumbers.includes(num));

                if (matchedInRow.length === rowNumbers.length) {
                    const lineNames = ['Top Line', 'Middle Line', 'Bottom Line'];
                    winners.push({
                        ticketId: ticket.id,
                        userId: ticket.user_id,
                        winType: lineNames[i]
                    });
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
                winners.push({
                    ticketId: ticket.id,
                    userId: ticket.user_id,
                    winType: 'Full House'
                });
            }
        }

        // Update winners in database
        for (const winner of winners) {
            await pool.query(
                'UPDATE tickets SET is_winner = TRUE, win_type = $1 WHERE id = $2',
                [winner.winType, winner.ticketId]
            );
        }

        return winners;
    } catch (error) {
        console.error('Error checking winners:', error);
        return [];
    }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});