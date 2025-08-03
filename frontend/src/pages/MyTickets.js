import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MyTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [activeTab, setActiveTab] = useState('active');
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showTicketModal, setShowTicketModal] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();

    // Generate random housie ticket numbers
    const generateTicketNumbers = () => {
        const ticket = Array(3).fill().map(() => Array(9).fill(null));

        for (let col = 0; col < 9; col++) {
            const min = col * 10 + (col === 0 ? 1 : 0);
            const max = col * 10 + 9;
            const colNumbers = [];

            // Generate 1-3 numbers per column
            const numbersInCol = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < numbersInCol; i++) {
                let num;
                do {
                    num = Math.floor(Math.random() * (max - min + 1)) + min;
                } while (colNumbers.includes(num));
                colNumbers.push(num);
            }

            // Place numbers randomly in the column
            colNumbers.forEach(num => {
                let row;
                do {
                    row = Math.floor(Math.random() * 3);
                } while (ticket[row][col] !== null);
                ticket[row][col] = num;
            });
        }

        return ticket;
    };

    // Mock ticket data
    const mockTickets = [
        {
            id: 1,
            roomName: 'Quick Game Room',
            gameType: 'traditional',
            ticketPrice: 50,
            status: 'active',
            purchaseDate: '2025-08-03T10:30:00Z',
            gameStartTime: '2025-08-03T15:00:00Z',
            numbers: generateTicketNumbers(),
            markedNumbers: [5, 23, 45, 67],
            prizeWon: null
        },
        {
            id: 2,
            roomName: 'Speed Housie Championship',
            gameType: 'speed',
            ticketPrice: 100,
            status: 'playing',
            purchaseDate: '2025-08-03T09:15:00Z',
            gameStartTime: '2025-08-03T14:00:00Z',
            numbers: generateTicketNumbers(),
            markedNumbers: [12, 34, 56, 78, 89],
            prizeWon: null
        },
        {
            id: 3,
            roomName: 'Evening Special',
            gameType: 'pattern',
            ticketPrice: 75,
            status: 'completed',
            purchaseDate: '2025-08-02T16:20:00Z',
            gameStartTime: '2025-08-02T20:00:00Z',
            gameEndTime: '2025-08-02T21:30:00Z',
            numbers: generateTicketNumbers(),
            markedNumbers: [1, 15, 23, 34, 45, 56, 67, 78, 89],
            prizeWon: { type: 'Full House', amount: 500 }
        },
        {
            id: 4,
            roomName: 'Morning Delight',
            gameType: 'traditional',
            ticketPrice: 25,
            status: 'completed',
            purchaseDate: '2025-08-01T08:00:00Z',
            gameStartTime: '2025-08-01T10:00:00Z',
            gameEndTime: '2025-08-01T11:15:00Z',
            numbers: generateTicketNumbers(),
            markedNumbers: [2, 14, 27, 33, 48, 59],
            prizeWon: { type: 'Early Five', amount: 100 }
        }
    ];

    useEffect(() => {
        // Simulate API call
        const fetchTickets = async () => {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setTickets(mockTickets);
            setLoading(false);
        };

        fetchTickets();
    }, []);

    const filteredTickets = tickets.filter(ticket => {
        if (activeTab === 'active') return ticket.status === 'active' || ticket.status === 'playing';
        if (activeTab === 'completed') return ticket.status === 'completed';
        return true;
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-yellow-100 text-yellow-800';
            case 'playing': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getGameTypeColor = (gameType) => {
        switch (gameType) {
            case 'traditional': return 'bg-blue-100 text-blue-800';
            case 'speed': return 'bg-red-100 text-red-800';
            case 'pattern': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleViewTicket = (ticket) => {
        setSelectedTicket(ticket);
        setShowTicketModal(true);
    };

    const handleJoinGame = (ticket) => {
        navigate(`/room/${ticket.id}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Tickets</h1>
                            <p className="text-gray-600">View and manage your game tickets</p>
                        </div>
                        <button
                            onClick={() => navigate('/rooms')}
                            className="mt-4 md:mt-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                        >
                            Browse Rooms
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${activeTab === 'active'
                                ? 'bg-white text-purple-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Active Games
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${activeTab === 'completed'
                                ? 'bg-white text-purple-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Completed Games
                        </button>
                    </div>
                </div>

                {/* Tickets List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        <p className="text-white mt-4">Loading tickets...</p>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
                        <p className="text-gray-600 text-lg mb-4">
                            {activeTab === 'active' ? 'No active tickets found.' : 'No completed games found.'}
                        </p>
                        {activeTab === 'active' && (
                            <button
                                onClick={() => navigate('/rooms')}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                            >
                                Buy Your First Ticket
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredTickets.map((ticket) => (
                            <div key={ticket.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-gray-800">{ticket.roomName}</h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                                {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGameTypeColor(ticket.gameType)}`}>
                                                {ticket.gameType.charAt(0).toUpperCase() + ticket.gameType.slice(1)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                            <div>
                                                <span className="font-medium">Ticket Price:</span>
                                                <br />₹{ticket.ticketPrice}
                                            </div>
                                            <div>
                                                <span className="font-medium">Purchased:</span>
                                                <br />{formatDate(ticket.purchaseDate)}
                                            </div>
                                            <div>
                                                <span className="font-medium">Game Time:</span>
                                                <br />{formatDate(ticket.gameStartTime)}
                                            </div>
                                            {ticket.prizeWon && (
                                                <div>
                                                    <span className="font-medium text-green-600">Prize Won:</span>
                                                    <br />
                                                    <span className="text-green-600 font-semibold">
                                                        {ticket.prizeWon.type} - ₹{ticket.prizeWon.amount}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-3 mt-4 md:mt-0">
                                        <button
                                            onClick={() => handleViewTicket(ticket)}
                                            className="bg-gray-100 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                                        >
                                            View Ticket
                                        </button>
                                        {(ticket.status === 'active' || ticket.status === 'playing') && (
                                            <button
                                                onClick={() => handleJoinGame(ticket)}
                                                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                                            >
                                                {ticket.status === 'playing' ? 'Resume Game' : 'Join Game'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Ticket Modal */}
                {showTicketModal && selectedTicket && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800">Ticket #{selectedTicket.id}</h3>
                                <button
                                    onClick={() => setShowTicketModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="mb-4">
                                <p className="text-gray-600 mb-2">{selectedTicket.roomName}</p>
                                <div className="flex gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                                        {selectedTicket.status.charAt(0).toUpperCase() + selectedTicket.status.slice(1)}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGameTypeColor(selectedTicket.gameType)}`}>
                                        {selectedTicket.gameType.charAt(0).toUpperCase() + selectedTicket.gameType.slice(1)}
                                    </span>
                                </div>
                            </div>

                            {/* Housie Ticket */}
                            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-dashed border-orange-300 rounded-lg p-4 mb-4">
                                <div className="grid grid-cols-9 gap-1">
                                    {selectedTicket.numbers.map((row, rowIndex) =>
                                        row.map((number, colIndex) => (
                                            <div
                                                key={`${rowIndex}-${colIndex}`}
                                                className={`aspect-square flex items-center justify-center text-sm font-medium border rounded ${number
                                                    ? selectedTicket.markedNumbers.includes(number)
                                                        ? 'bg-green-200 border-green-400 text-green-800'
                                                        : 'bg-white border-gray-300'
                                                    : 'bg-gray-100 border-gray-200'
                                                    }`}
                                            >
                                                {number || ''}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Numbers Marked:</span>
                                    <span className="font-medium">{selectedTicket.markedNumbers.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Ticket Price:</span>
                                    <span className="font-medium">₹{selectedTicket.ticketPrice}</span>
                                </div>
                                {selectedTicket.prizeWon && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Prize Won:</span>
                                        <span className="font-medium text-green-600">
                                            {selectedTicket.prizeWon.type} - ₹{selectedTicket.prizeWon.amount}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6">
                                <button
                                    onClick={() => setShowTicketModal(false)}
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyTickets;