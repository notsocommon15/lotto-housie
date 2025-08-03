import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import HousieTicket from '../components/HousieTicket';

const GameRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { socket, joinRoom, leaveRoom } = useSocket();
    const { user, updateUserBalance } = useAuth();
    const [room, setRoom] = useState(null);
    const [userTicket, setUserTicket] = useState(null);
    const [calledNumbers, setCalledNumbers] = useState([]);
    const [currentNumber, setCurrentNumber] = useState(null);
    const [winStatus, setWinStatus] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasPurchasedTicket, setHasPurchasedTicket] = useState(false);

    useEffect(() => {
        fetchRoomDetails();
        fetchUserTicket();

        if (socket) {
            joinRoom(roomId);

            socket.on('number-called', (data) => {
                setCalledNumbers(data.calledNumbers);
                setCurrentNumber(data.number);
                toast.info(`Number called: ${data.number}`);

                // Check win status after each number
                if (userTicket) {
                    checkWinStatus();
                }
            });

            socket.on('winners-found', (winners) => {
                const userWins = winners.filter(w => w.userId === user.id);
                userWins.forEach(win => {
                    toast.success(`🎉 Congratulations! You won: ${win.winType}!`);
                });
            });

            return () => {
                leaveRoom(roomId);
                socket.off('number-called');
                socket.off('winners-found');
            };
        }
    }, [socket, roomId, userTicket, user.id]);

    const fetchRoomDetails = async () => {
        try {
            const response = await axios.get(`/api/game/room/${roomId}`);
            setRoom(response.data.room);

            if (response.data.game) {
                setCalledNumbers(response.data.game.called_numbers || []);
                setCurrentNumber(response.data.game.current_number);
            }
        } catch (error) {
            toast.error('Failed to fetch room details');
            navigate('/rooms');
        }
    };

    const fetchUserTicket = async () => {
        try {
            const response = await axios.get(`/api/ticket/my-tickets?roomId=${roomId}`);
            if (response.data.tickets.length > 0) {
                setUserTicket(response.data.tickets[0]);
                setHasPurchasedTicket(true);
                checkWinStatus();
            }
        } catch (error) {
            console.error('Failed to fetch user ticket');
        } finally {
            setIsLoading(false);
        }
    };

    const checkWinStatus = async () => {
        if (!userTicket) return;

        try {
            const response = await axios.get(`/api/ticket/${userTicket.id}/check-win`);
            setWinStatus(response.data.winStatus);
        } catch (error) {
            console.error('Failed to check win status');
        }
    };

    const buyTicket = async () => {
        try {
            
            const response = await axios.post('/api/ticket/buy', { roomId });
            setUserTicket(response.data.ticket);
            setHasPurchasedTicket(true);

            // Update user balance
            const newBalance = user.wallet_balance - room.ticket_price;
            updateUserBalance(newBalance);

            toast.success('Ticket purchased successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to purchase ticket');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Room Header */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{room?.name}</h1>
                        <p className="text-gray-600 mt-2">
                            Ticket Price: ₹{room?.ticket_price} | Status: {room?.status}
                        </p>
                    </div>
                    {room?.organizer_id === user.id && (
                        <button
                            onClick={() => navigate(`/organizer-board/${roomId}`)}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
                        >
                            Open Organizer Board
                        </button>
                    )}
                </div>
            </div>

            {/* Current Number Display */}
            {currentNumber && (
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6 text-center">
                    <h2 className="text-xl font-semibold mb-4">Current Number</h2>
                    <div className="inline-block bg-red-500 text-white text-6xl font-bold rounded-full w-24 h-24 flex items-center justify-center">
                        {currentNumber}
                    </div>
                </div>
            )}

            {/* Ticket Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">Your Ticket</h2>

                {!hasPurchasedTicket ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">You haven't purchased a ticket for this room yet.</p>
                        <button
                            onClick={buyTicket}
                            disabled={room?.status !== 'waiting'}
                            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold"
                        >
                            {room?.status !== 'waiting'
                                ? 'Room No Longer Accepting Tickets'
                                : `Buy Ticket - ₹${room?.ticket_price}`
                            }
                        </button>
                    </div>
                ) : (
                    <div>
                        <HousieTicket
                            ticketNumbers={userTicket.ticket_numbers}
                            calledNumbers={calledNumbers}
                            showWinIndicators={true}
                            winStatus={winStatus}
                            className="max-w-md mx-auto"
                        />

                        {winStatus.length > 0 && (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h3 className="font-semibold text-green-800 mb-2">🎉 Congratulations!</h3>
                                <div className="flex flex-wrap gap-2">
                                    {winStatus.map((win, index) => (
                                        <span key={index} className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                                            {win}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Called Numbers */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Called Numbers ({calledNumbers.length})</h2>
                {calledNumbers.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No numbers called yet</p>
                ) : (
                    <div className="grid grid-cols-10 gap-2">
                        {calledNumbers.map((number, index) => (
                            <div
                                key={index}
                                className={`
                  p-2 rounded text-center font-semibold
                  ${number === currentNumber
                                        ? 'bg-red-500 text-white'
                                        : 'bg-blue-100 text-blue-800'
                                    }
                `}
                            >
                                {number}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Game Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">How to Play</h3>
                <div className="text-blue-700 text-sm space-y-2">
                    <p><strong>Early Five:</strong> First player to match any 5 numbers wins</p>
                    <p><strong>Top/Middle/Bottom Line:</strong> Complete any full row to win</p>
                    <p><strong>Full House:</strong> Match all numbers on your ticket</p>
                    <p><strong>Green numbers:</strong> Called numbers that match your ticket</p>
                    <p><strong>Blue border:</strong> Indicates line wins</p>
                    <p><strong>Yellow border:</strong> Indicates full house win</p>
                </div>
            </div>
        </div>
    );
};

export default GameRoom;