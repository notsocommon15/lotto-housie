import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const CreateRoom = () => {
    const [formData, setFormData] = useState({
        roomName: '',
        maxPlayers: 10,
        ticketPrice: 50,
        gameType: 'traditional',
        isPrivate: false,
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();

    const gameTypes = [
        { value: 'traditional', label: 'Traditional Housie', description: 'Classic 90-ball housie game' },
        { value: 'speed', label: 'Speed Housie', description: 'Fast-paced game with quick number calls' },
        { value: 'pattern', label: 'Pattern Game', description: 'Win by completing specific patterns' }
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.roomName.trim()) {
            newErrors.roomName = 'Room name is required';
        } else if (formData.roomName.length < 3) {
            newErrors.roomName = 'Room name must be at least 3 characters';
        }

        if (formData.maxPlayers < 2) {
            newErrors.maxPlayers = 'At least 2 players required';
        } else if (formData.maxPlayers > 100) {
            newErrors.maxPlayers = 'Maximum 100 players allowed';
        }

        if (formData.ticketPrice < 10) {
            newErrors.ticketPrice = 'Minimum ticket price is ₹10';
        } else if (formData.ticketPrice > 1000) {
            newErrors.ticketPrice = 'Maximum ticket price is ₹1000';
        }

        if (formData.isPrivate && !formData.password.trim()) {
            newErrors.password = 'Password is required for private rooms';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const response = await axios.post(
                '/api/game/room',
                {
                    name: formData.roomName,
                    ticketPrice: formData.ticketPrice,
                    maxPlayers: formData.maxPlayers
                    // If you store gameType or isPrivate or password in DB, add them here
                },
                {
                    headers: {
                        Authorization: `Bearer ${user.token}` // 👈 Ensure this exists!
                    }
                }
            );

            const createdRoom = response.data.room;

            // For demo, navigate to the game room
            navigate(`/room/${createdRoom.id}`);
        } catch (error) {
            setErrors({ submit: 'Failed to create room. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Game Room</h1>
                        <p className="text-gray-600">Set up your housie game room</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-2">
                                Room Name
                            </label>
                            <input
                                type="text"
                                id="roomName"
                                name="roomName"
                                value={formData.roomName}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.roomName ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Enter room name"
                            />
                            {errors.roomName && <p className="mt-1 text-sm text-red-500">{errors.roomName}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-700 mb-2">
                                    Max Players
                                </label>
                                <input
                                    type="number"
                                    id="maxPlayers"
                                    name="maxPlayers"
                                    value={formData.maxPlayers}
                                    onChange={handleChange}
                                    min="2"
                                    max="100"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.maxPlayers ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.maxPlayers && <p className="mt-1 text-sm text-red-500">{errors.maxPlayers}</p>}
                            </div>

                            <div>
                                <label htmlFor="ticketPrice" className="block text-sm font-medium text-gray-700 mb-2">
                                    Ticket Price (₹)
                                </label>
                                <input
                                    type="number"
                                    id="ticketPrice"
                                    name="ticketPrice"
                                    value={formData.ticketPrice}
                                    onChange={handleChange}
                                    min="10"
                                    max="1000"
                                    step="10"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.ticketPrice ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.ticketPrice && <p className="mt-1 text-sm text-red-500">{errors.ticketPrice}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-4">
                                Game Type
                            </label>
                            <div className="space-y-3">
                                {gameTypes.map((type) => (
                                    <div key={type.value} className="flex items-start">
                                        <input
                                            type="radio"
                                            id={type.value}
                                            name="gameType"
                                            value={type.value}
                                            checked={formData.gameType === type.value}
                                            onChange={handleChange}
                                            className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                                        />
                                        <div className="ml-3">
                                            <label htmlFor={type.value} className="text-sm font-medium text-gray-700">
                                                {type.label}
                                            </label>
                                            <p className="text-sm text-gray-500">{type.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isPrivate"
                                    name="isPrivate"
                                    checked={formData.isPrivate}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isPrivate" className="ml-2 text-sm font-medium text-gray-700">
                                    Make this room private
                                </label>
                            </div>

                            {formData.isPrivate && (
                                <div className="mt-4">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                        Room Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.password ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter room password"
                                    />
                                    {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                                </div>
                            )}
                        </div>

                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {errors.submit}
                            </div>
                        )}

                        <div className="flex space-x-4">
                            <button
                                type="button"
                                onClick={() => navigate('/rooms')}
                                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                {loading ? 'Creating Room...' : 'Create Room'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateRoom;