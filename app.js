const express = require('express');
const path = require('path');
const prisma = require('./config/prismaDb');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/test/heatlh', (req, res) => {

    prisma.$connect();
    res.json({ status: 'UP', message: 'Database connected' });
});

module.exports = app;