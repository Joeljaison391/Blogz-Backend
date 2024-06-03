const prisma = require('../config/prismaDb');

const updateRouteAnalytics = async (routePath) => {
    try {

        const data = await prisma.routeAnalytics.upsert({
            where: { routePath },
            create: { routePath, requestCount: 1 },
            update: { requestCount: { increment: 1 } }
        });
    } catch (error) {
        console.error('Error updating route analytics:', error);
        
    }
};

module.exports = updateRouteAnalytics;
