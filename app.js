const express = require('express');
const path = require('path');
const prisma = require('./config/prismaDb');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const rateLimiter = require('./middlewares/rateLimiter');
const cors = require('cors');
const errorMiddleware = require('./middlewares/errorMiddleware');

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





app.use('/api/v2/auth/user', require('./routes/userAuthRoutes'));

// Clean up test users
//⚠️ Warning: This will delete all users from the database
app.delete('/reset-database', async (req, res) => {
    try {
        // Deleting records from tables with foreign key dependencies first
        await prisma.loginLog.deleteMany();
        await prisma.session.deleteMany();
        await prisma.passwordResetToken.deleteMany();
        await prisma.emailVerificationToken.deleteMany();
        await prisma.comment.deleteMany();
        await prisma.like.deleteMany();
        await prisma.analytics.deleteMany();
        await prisma.topReaders.deleteMany();
        await prisma.topWriters.deleteMany();
        await prisma.postMetadata.deleteMany();
        await prisma.post.deleteMany();
        await prisma.tag.deleteMany();
        await prisma.routeAnalytics.deleteMany();

        // Deleting records from the User table
        await prisma.user.deleteMany();

        res.json({ message: 'All tables have been reset' });
    } catch (error) {
        console.error('Error resetting database:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

app.use(errorMiddleware);


module.exports = app;