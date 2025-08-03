import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import axios from 'axios';

const RoomList = () => {
    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [loading, setLoading] = useState(true);
    const [joinPassword, setJoinPassword] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();



    useEffect(() => {
        // Simulate API call
        const fetchRooms = async () => {
            setLoading(true);
            const response = await axios.get('/api/game/rooms');
            const mappedRooms = response.data.rooms.map(room => ({
                id: room.id,
                roomName: room.name,
                host: { username: room.organizer_name },
                players: Array.from({ length: parseInt(room.player_count || 0) }, (_, i) => ({ username: `Player${i + 1}` })),
                maxPlayers: room.max_players,
                ticketPrice: room.ticket_price,
                gameType: 'traditional', // or use room.game_type if you add it
                isPrivate: room.is_private || false,
                status: room.status
            }));
            setRooms(mappedRooms);
            setFilteredRooms(mappedRooms);
            setLoading(false);
        };

        fetchRooms();
    }, []);

    useEffect(() => {
        let filtered = rooms;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(room =>
                room.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                room.host.username.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by type
        if (filterType !== 'all') {
            if (filterType === 'available') {
                filtered = filtered.filter(room => room.status === 'waiting' && room.players.length < room.maxPlayers);
            } else if (filterType === 'playing') {
                filtered = filtered.filter(room => room.status === 'playing');
            } else {
                filtered = filtered.filter(room => room.gameType === filterType);
            }
        }

        setFilteredRooms(filtered);
    }, [searchTerm, filterType, rooms]);

    const handleJoinRoom = (room) => {
        if (room.isPrivate) {
            setSelectedRoom(room);
            setShowPasswordModal(true);
        } else {
            joinRoom(room);
        }
    };

    const joinRoom = (room, password = '') => {
        // Simulate joining room
        if (room.isPrivate && password !== 'password123') {
            alert('Incorrect password!');
            return;
        }

        navigate(`/room/${room.id}`, { state: { room } });
    };

    const handlePasswordSubmit = () => {
        if (selectedRoom) {
            joinRoom(selectedRoom, joinPassword);
            setShowPasswordModal(false);
            setJoinPassword('');
            setSelectedRoom(null);
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'waiting': return 'bg-yellow-100 text-yellow-800';
            case 'playing': return 'bg-green-100 text-green-800';
            case 'finished': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Game Rooms</h1>
                            <p className="text-gray-600">Join a room or create your own</p>
                        </div>
                        <button
                            onClick={() => navigate('/create-room')}
                            className="mt-4 md:mt-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                        >
                            Create Room
                        </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search rooms or hosts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="all">All Rooms</option>
                            <option value="available">Available</option>
                            <option value="playing">Currently Playing</option>
                            <option value="traditional">Traditional</option>
                            <option value="speed">Speed Housie</option>
                            <option value="pattern">Pattern Game</option>
                        </select>
                    </div>
                </div>

                {/* Rooms Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        <p className="text-white mt-4">Loading rooms...</p>
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
                        <p className="text-gray-600 text-lg">No rooms found matching your criteria.</p>
                        <button
                            onClick={() => navigate('/create-room')}
                            className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                        >
                            Create First Room
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRooms.map((room) => (
                            <div key={room.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-gray-800 truncate">{room.roomName}</h3>
                                    {room.isPrivate && (
                                        <span className="text-yellow-600 text-sm">🔒 Private</span>
                                    )}
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Host:</span>
                                        <span className="font-medium">{room.host.username}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Players:</span>
                                        <span className="font-medium">{room.players.length}/{room.maxPlayers}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Ticket Price:</span>
                                        <span className="font-medium">₹{room.ticketPrice}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Type:</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGameTypeColor(room.gameType)}`}>
                                            {room.gameType.charAt(0).toUpperCase() + room.gameType.slice(1)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Status:</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                                            {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleJoinRoom(room)}
                                    disabled={room.players.length >= room.maxPlayers}
                                    className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${room.players.length >= room.maxPlayers
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : room.status === 'playing'
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                                        }`}
                                >
                                    {room.players.length >= room.maxPlayers
                                        ? 'Room Full'
                                        : room.status === 'playing'
                                            ? 'Watch Game'
                                            : 'Join Room'
                                    }
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Password Modal */}
                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Enter Room Password</h3>
                            <p className="text-gray-600 mb-4">This room is private. Please enter the password to join.</p>

                            <input
                                type="password"
                                value={joinPassword}
                                onChange={(e) => setJoinPassword(e.target.value)}
                                placeholder="Enter password"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
                                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                            />

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setJoinPassword('');
                                        setSelectedRoom(null);
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePasswordSubmit}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                                >
                                    Join Room
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomList;