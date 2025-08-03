import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'https://lotto-housie.onrender.com', {
                auth: {
                    userId: user.id
                },
                transports: ['websocket'], // ✅ Force websocket transport
            });

            newSocket.on('connect', () => {
                console.log('Connected to server');
                setIsConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('Disconnected from server');
                setIsConnected(false);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
        }
    }, [user]);

    const joinRoom = (roomId) => {
        if (socket) {
            socket.emit('join-room', roomId);
        }
    };

    const leaveRoom = (roomId) => {
        if (socket) {
            socket.emit('leave-room', roomId);
        }
    };

    const callNumber = (roomId, number, calledNumbers) => {
        if (socket) {
            socket.emit('call-number', { roomId, number, calledNumbers });
        }
    };

    const value = {
        socket,
        isConnected,
        joinRoom,
        leaveRoom,
        callNumber
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};