const express = require('express');
const path = require('path');
const prisma = require('./config/prismaDb');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const rateLimiter = require('./middlewares/rateLimiter');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(rateLimiter);


const ORIGIN_URLS = process.env.ORIGIN_URLS ? process.env.ORIGIN_URLS.split(',') : [];

const corsOptions = {
    origin: (origin, callback) => {
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

app.get('/analytics', async (req, res) => {
    try {
        const analyticsData = await prisma.routeAnalytics.findMany();
        res.json(analyticsData);
    } catch (error) {
        console.error('Error fetching analytics data:', error);
        res.status(500).send('Internal server error');
    }
});

module.exports = app;