const express = require('express');
const path = require('path');
const prisma = require('./config/prismaDb');

const cors = require('cors');

const app = express();

const ORIGIN_URLS = process.env.ORIGIN_URLS ? process.env.ORIGIN_URLS.split(',') : [];

const corsOptions = {
    origin: (origin, callback) => {
        // Check if the origin is in the allowed list or if there's no origin (like for same-origin requests)
        if (ORIGIN_URLS.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

app.use(cors(corsOptions));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/test/heatlh', (req, res) => {

    prisma.$connect();
    res.json({ status: 'UP', message: 'Database connected' });
});

module.exports = app;