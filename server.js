const app = require('./app');
const prisma = require('./config/prismaDb');


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    if (prisma){
        prisma.$connect();
        console.log('Database connected');
    }
});

process.on('SIGINT', () => {
    console.log('Shutting down server gracefully...');
    prisma.$disconnect();
    process.exit(0);
  });