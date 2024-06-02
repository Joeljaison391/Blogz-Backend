const prisma = require('../config/prismaDb');

const updateRouteAnalytics = async (routePath) => {
    try {
        console.log('Updating analytics for route:', routePath);

        const data = await prisma.routeAnalytics.upsert({
            where: { routePath },
            create: { routePath, requestCount: 1 },
            update: { requestCount: { increment: 1 } }
        });

        console.log('Route analytics updated:', data);
        
    } catch (error) {
        console.error('Error updating route analytics:', error);
        // Handle error gracefully
    }
};

module.exports = updateRouteAnalytics;
