const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify user still exists
        const result = await pool.query(
            'SELECT id, username, email, role FROM public.users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Token is not valid' });
        }

        req.userId = decoded.userId;
        req.user = result.rows[0];
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const organizer = (req, res, next) => {
    if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Organizer role required.' });
    }
    next();
};

module.exports = { auth, organizer };