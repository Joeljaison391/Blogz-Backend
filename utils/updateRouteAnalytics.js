const prisma = require('../config/prismaDb');

const updateRouteAnalytics = async (routePath) => {
    try {
        console.log('Updating analytics for route:', routePath);

        // Try to update the route. If it doesn't exist, create a new record.

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
