import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Dashboard = () => {
    const { user } = useAuth();
    const [recentRooms, setRecentRooms] = useState([]);
    const [userTickets, setUserTickets] = useState([]);
    const [stats, setStats] = useState({
        totalRooms: 0,
        activeRooms: 0,
        totalTickets: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [roomsResponse, ticketsResponse] = await Promise.all([
                axios.get('/api/game/rooms'),
                axios.get('/api/ticket/my-tickets')
            ]);

            const rooms = roomsResponse.data.rooms;
            setRecentRooms(rooms.slice(0, 5)); // Show only recent 5 rooms
            setUserTickets(ticketsResponse.data.tickets.slice(0, 5)); // Show only recent 5 tickets

            setStats({
                totalRooms: rooms.length,
                activeRooms: rooms.filter(room => room.status === 'active').length,
                totalTickets: ticketsResponse.data.tickets.length
            });
        } catch (error) {
            toast.error('Failed to fetch dashboard data');
        } finally {
            setIsLoading(false);
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
        <div className="max-w-6xl mx-auto p-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 mb-8">
                <h1 className="text-4xl font-bold mb-2">
                    Welcome back, {user.username}!
                </h1>
                <p className="text-xl opacity-90">
                    Ready to play some Lotto Housie? Check out the latest rooms or create your own.
                </p>
                <div className="mt-6 flex space-x-4">
                    <Link
                        to="/rooms"
                        className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    >
                        Browse Rooms
                    </Link>
                    {(user.role === 'organizer' || user.role === 'admin') && (
                        <Link
                            to="/create-room"
                            className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                        >
                            Create Room
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center">
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-900">{stats.totalRooms}</p>
                            <p className="text-gray-600">Total Rooms</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center">
                        <div className="bg-green-100 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-900">{stats.activeRooms}</p>
                            <p className="text-gray-600">Active Games</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center">
                        <div className="bg-yellow-100 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
                            <p className="text-gray-600">My Tickets</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center">
                        <div className="bg-purple-100 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-900">₹{parseFloat(user.wallet_balance).toFixed(2)}</p>
                            <p className="text-gray-600">Wallet Balance</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Rooms */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Recent Rooms</h2>
                        <Link to="/rooms" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View All
                        </Link>
                    </div>

                    {recentRooms.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No rooms available</p>
                    ) : (
                        <div className="space-y-3">
                            {recentRooms.map((room) => (
                                <div key={room.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{room.name}</h3>
                                            <p className="text-sm text-gray-600">
                                                By {room.organizer_name} • ₹{room.ticket_price} • {room.player_count} players
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${room.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                                                room.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {room.status}
                                            </span>
                                            <Link
                                                to={`/room/${room.id}`}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                                            >
                                                Join
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* My Recent Tickets */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">My Recent Tickets</h2>
                        <Link to="/my-tickets" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View All
                        </Link>
                    </div>

                    {userTickets.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No tickets purchased yet</p>
                    ) : (
                        <div className="space-y-3">
                            {userTickets.map((ticket) => (
                                <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{ticket.room_name}</h3>
                                            <p className="text-sm text-gray-600">
                                                ₹{ticket.ticket_price} • {ticket.room_status}
                                                {ticket.is_winner && (
                                                    <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                                        Winner: {ticket.win_type}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <Link
                                            to={`/room/${ticket.room_id}`}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                                        >
                                            View
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;