import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext();

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL;

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            loadUserProfile();
        } else {
            setLoading(false);
        }
    }, []);

    const loadUserProfile = async () => {
        try {
            const response = await axios.get('/api/auth/profile');
            setUser(response.data.user);
        } catch (error) {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            toast.error('Session expired. Please login again.');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            
            const response = await axios.post('/api/auth/login', { email, password });
            const { user, token } = response.data;

            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const fullUser = { ...user, token };
            setUser(fullUser);

            toast.success('Login successful!');
            return true;
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            toast.error(message);
            return false;
        }
    };

    const register = async (userData) => {
        try {
            const response = await axios.post('/api/auth/register', userData);
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const fullUser = { ...user, token };
            setUser(fullUser);

            toast.success('Registration successful!');
            return true;
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed';
            toast.error(message);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        toast.success('Logged out successfully');
    };

    const updateUserBalance = (newBalance) => {
        setUser(prev => ({ ...prev, wallet_balance: newBalance }));
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        updateUserBalance,
        refreshProfile: loadUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};