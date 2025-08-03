import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-blue-600 text-white shadow-lg">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    <Link to="/dashboard" className="text-2xl font-bold">
                        Lotto Housie
                    </Link>

                    {user ? (
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-4">
                                <span className="text-sm">
                                    Welcome, {user.username}
                                </span>
                                <span className="bg-green-500 px-2 py-1 rounded text-sm">
                                    ₹{parseFloat(user.wallet_balance).toFixed(2)}
                                </span>
                                <span className="bg-blue-500 px-2 py-1 rounded text-xs uppercase">
                                    {user.role}
                                </span>
                            </div>

                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/dashboard"
                                    className="hover:text-blue-200 transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/rooms"
                                    className="hover:text-blue-200 transition-colors"
                                >
                                    Rooms
                                </Link>
                                <Link
                                    to="/my-tickets"
                                    className="hover:text-blue-200 transition-colors"
                                >
                                    My Tickets
                                </Link>
                                {(user.role === 'organizer' || user.role === 'admin') && (
                                    <Link
                                        to="/create-room"
                                        className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded transition-colors"
                                    >
                                        Create Room
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/login"
                                className="hover:text-blue-200 transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded transition-colors"
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;