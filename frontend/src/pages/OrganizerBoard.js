import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const OrganizerBoard = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [game, setGame] = useState(null);
    const [calledNumbers, setCalledNumbers] = useState([]);
    const [currentNumber, setCurrentNumber] = useState(null);
    const [winners, setWinners] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGameActive, setIsGameActive] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastWinnerCount, setLastWinnerCount] = useState(0); // Track winner count changes

    const refreshIntervalRef = useRef(null);
    const isComponentMountedRef = useRef(true);

    useEffect(() => {
        isComponentMountedRef.current = true;
        fetchRoomDetails();

        return () => {
            isComponentMountedRef.current = false;
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [roomId]);

    // Auto-refresh effect
    useEffect(() => {
        if (autoRefresh && !isLoading) {
            refreshIntervalRef.current = setInterval(() => {
                if (isComponentMountedRef.current) {
                    fetchRoomDetailsQuietly();
                }
            }, 3000); // Reduced to 3 seconds for faster winner updates
        } else {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
            }
        }

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [autoRefresh, isLoading]);

    // Helper function to safely extract and normalize winners data
    const extractWinners = (responseData) => {
        try {
            // Check multiple possible locations for winners data
            const winnersData = responseData.game?.winners ||
                responseData.winners ||
                responseData.game?.game_winners ||
                responseData.game?.winnersList ||
                [];

            console.log('Raw winners data:', winnersData); // Debug log

            // Ensure it's an array and normalize the data structure
            if (!Array.isArray(winnersData)) {
                console.warn('Winners data is not an array:', winnersData);
                return [];
            }

            // Normalize winner objects to ensure consistent structure
            return winnersData.map((winner, index) => {
                if (typeof winner === 'string') {
                    // Handle case where winner is just a string
                    return {
                        id: index,
                        username: winner,
                        winType: 'Win',
                        timestamp: Date.now()
                    };
                }

                // Normalize winner object
                return {
                    id: winner.id || winner.winnerId || index,
                    userId: winner.userId || winner.user_id,
                    username: winner.username || winner.user_name || winner.playerName || `User ${winner.userId || winner.user_id || index}`,
                    winType: winner.winType || winner.win_type || winner.type || 'Win',
                    timestamp: winner.timestamp || winner.created_at || Date.now(),
                    ticketId: winner.ticketId || winner.ticket_id,
                    ...winner // Keep any additional properties
                };
            });
        } catch (error) {
            console.error('Error extracting winners:', error);
            return [];
        }
    };

    const fetchRoomDetails = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`/api/game/room/${roomId}`);

            if (isComponentMountedRef.current) {
                const { room: roomData, game: gameData } = response.data;

                setRoom(roomData);
                setGame(gameData);

                if (gameData) {
                    setCalledNumbers(gameData.called_numbers || []);
                    setCurrentNumber(gameData.current_number);
                    setIsGameActive(gameData.status === 'active');

                    // Extract and set winners with improved handling
                    const extractedWinners = extractWinners(response.data);
                    console.log('Extracted winners:', extractedWinners); // Debug log

                    setWinners(extractedWinners);
                    setLastWinnerCount(extractedWinners.length);
                }
            }
        } catch (error) {
            console.error('Failed to fetch room details:', error);
            if (isComponentMountedRef.current) {
                alert('Failed to fetch room details');
                navigate('/dashboard');
            }
        } finally {
            if (isComponentMountedRef.current) {
                setIsLoading(false);
            }
        }
    };

    const fetchRoomDetailsQuietly = async () => {
        try {
            const response = await axios.get(`/api/game/room/${roomId}`);

            if (isComponentMountedRef.current) {
                const { room: roomData, game: gameData } = response.data;

                setRoom(roomData);
                setGame(gameData);

                if (gameData) {
                    setCalledNumbers(gameData.called_numbers || []);
                    setCurrentNumber(gameData.current_number);
                    setIsGameActive(gameData.status === 'active');

                    // Extract winners and check for changes
                    const extractedWinners = extractWinners(response.data);

                    // Force update if winner count changed or array contents differ
                    setWinners(prevWinners => {
                        const winnersChanged = extractedWinners.length !== prevWinners.length ||
                            JSON.stringify(extractedWinners.map(w => w.id)) !== JSON.stringify(prevWinners.map(w => w.id));

                        if (winnersChanged) {
                            console.log('Winners updated:', extractedWinners);
                            setLastWinnerCount(extractedWinners.length);
                            return extractedWinners;
                        }
                        return prevWinners;
                    });
                }
            }
        } catch (error) {
            console.error('Background refresh failed:', error);
        }
    };

    const startGame = async () => {
        try {
            await axios.post(`/api/game/room/${roomId}/start`);
            alert('Game started!');
            setIsGameActive(true);
            fetchRoomDetails();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to start game');
        }
    };

    const callNumber = async () => {
        try {
            await axios.post(`/api/game/room/${roomId}/call-number`);
            // Immediate refresh after calling number
            setTimeout(() => fetchRoomDetailsQuietly(), 500);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to call number');
        }
    };

    const endGame = async () => {
        try {
            await axios.post(`/api/game/room/${roomId}/end`);
            alert('Game ended!');
            setIsGameActive(false);
            setAutoRefresh(false);
            navigate('/dashboard');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to end game');
        }
    };

    const toggleAutoRefresh = () => {
        setAutoRefresh(prev => !prev);
    };

    const manualRefresh = () => {
        fetchRoomDetails();
        alert('Data refreshed');
    };

    // Force refresh winners only
    const refreshWinners = async () => {
        try {
            const response = await axios.get(`/api/game/room/${roomId}`);
            const extractedWinners = extractWinners(response.data);
            setWinners(extractedWinners);
            console.log('Winners manually refreshed:', extractedWinners);
        } catch (error) {
            console.error('Failed to refresh winners:', error);
        }
    };

    const generateNumberGrid = () => {
        const grid = [];
        for (let i = 1; i <= 99; i++) {
            grid.push(i);
        }
        return grid;
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
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Organizer Board - {room?.name}
                    </h1>
                    <div className="flex space-x-3">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={toggleAutoRefresh}
                                className={`px-3 py-1 rounded text-sm font-medium ${autoRefresh
                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                                    }`}
                            >
                                Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
                            </button>
                            <button
                                onClick={manualRefresh}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium"
                                title="Manual refresh"
                            >
                                🔄
                            </button>
                        </div>

                        {!isGameActive ? (
                            <button
                                onClick={startGame}
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold"
                            >
                                Start Game
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={callNumber}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
                                    disabled={calledNumbers.length >= 99}
                                >
                                    Call Next Number
                                </button>
                                <button
                                    onClick={endGame}
                                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold"
                                >
                                    End Game
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {autoRefresh && (
                    <div className="flex items-center space-x-2 text-sm text-blue-600 mb-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span>Auto-refreshing every 3 seconds</span>
                    </div>
                )}

                {currentNumber && (
                    <div className="text-center mb-6">
                        <div className="inline-block bg-red-500 text-white text-6xl font-bold rounded-full w-24 h-24 flex items-center justify-center">
                            {currentNumber}
                        </div>
                        <p className="text-xl mt-2">Current Number</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">Game Statistics</h3>
                        <div className="space-y-2 text-sm">
                            <div>Total Numbers Called: {calledNumbers.length}/99</div>
                            <div>Room Status: <span className="capitalize">{room?.status}</span></div>
                            <div>Game Status: <span className="capitalize">{game?.status || 'Not started'}</span></div>
                            <div>Ticket Price: ₹{room?.ticket_price}</div>
                            <div>Players: {room?.player_count || 0}</div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold">Recent Winners</h3>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">({winners.length})</span>
                                <button
                                    onClick={refreshWinners}
                                    className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200"
                                    title="Refresh winners only"
                                >
                                    🔄
                                </button>
                                {lastWinnerCount !== winners.length && (
                                    <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded">
                                        Updated!
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1 text-sm max-h-20 overflow-y-auto">
                            {winners.length === 0 ? (
                                <p className="text-gray-500">No winners yet</p>
                            ) : (
                                winners.slice(-5).reverse().map((winner, index) => (
                                    <div key={`winner-${winner.id || index}-${winner.timestamp}`}
                                        className="text-green-600 flex justify-between items-center">
                                        <span className="font-medium">{winner.winType}</span>
                                        <span className="text-xs">{winner.username}</span>
                                    </div>
                                ))
                            )}
                        </div>
                        {winners.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        console.log('All winners:', winners);
                                        alert(`Total winners: ${winners.length}\n${winners.map(w => `${w.winType}: ${w.username}`).join('\n')}`);
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                    View All ({winners.length})
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Number Grid */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Number Board</h2>
                <div className="grid grid-cols-10 gap-2">
                    {generateNumberGrid().map((number) => (
                        <div
                            key={number}
                            className={`
                aspect-square flex items-center justify-center text-lg font-bold border-2 rounded-lg
                ${calledNumbers.includes(number)
                                    ? 'bg-red-500 text-white border-red-600'
                                    : 'bg-gray-100 text-gray-700 border-gray-300'
                                }
                ${number === currentNumber ? 'ring-4 ring-yellow-400' : ''}
              `}
                        >
                            {number}
                        </div>
                    ))}
                </div>
            </div>

            {/* Called Numbers History */}
            <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                <h2 className="text-xl font-bold mb-4">Called Numbers ({calledNumbers.length})</h2>
                {calledNumbers.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No numbers called yet</p>
                ) : (
                    <div className="grid grid-cols-10 gap-2">
                        {calledNumbers.map((number, index) => (
                            <div
                                key={`called-${index}-${number}`}
                                className={`p-2 rounded text-center font-semibold ${number === currentNumber
                                    ? 'bg-yellow-200 text-yellow-800 ring-2 ring-yellow-400'
                                    : 'bg-blue-100 text-blue-800'
                                    }`}
                            >
                                {number}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganizerBoard;