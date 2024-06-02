const request = require('supertest');
const app = require('../app.js'); 
const Redis = require('ioredis');

describe('GET /api/test/heatlh', () => {
    let redis;

    beforeEach(async () => {
        redis = new Redis(process.env.REDIS_URL);
      });
    
      afterEach(async () => {
        await redis.disconnect();
      });

    it('should return status UP and message Database connected', async () => {
        const response = await request(app).get('/api/test/heatlh');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'UP', message: 'Database connected' });
    });
});

describe('GET /analytics', () => {
    let redis;

    beforeEach(async () => {
        redis = new Redis(process.env.REDIS_URL);
      });
    
      afterEach(async () => {
        await redis.disconnect();
      });
    it('should return an array of analytics data', async () => {
        const response = await request(app).get('/analytics');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0); 
    
        
        response.body.forEach(analytics => {
            expect(analytics).toHaveProperty('routeAnalyticsId');
            expect(analytics).toHaveProperty('routePath');
            expect(analytics).toHaveProperty('requestCount');
            expect(analytics).toHaveProperty('createdAt');
            expect(analytics).toHaveProperty('updatedAt');
            expect(typeof analytics.routeAnalyticsId).toBe('number');
            expect(typeof analytics.routePath).toBe('string');
            expect(typeof analytics.requestCount).toBe('number');
            expect(typeof analytics.createdAt).toBe('string'); 
            expect(typeof analytics.updatedAt).toBe('string'); 
        });
    });
});
