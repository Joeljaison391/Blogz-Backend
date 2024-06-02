const Redis = require('ioredis');
const dotenv = require('dotenv');
const { LRUCache } = require('lru-cache')

dotenv.config();

if (!process.env.REDIS_URL) {
    throw new Error('Please provide a valid Redis URL');
}
const redis = new Redis(process.env.REDIS_URL); 

const cache = new LRUCache({
    max: 100000, 
    ttl: 1000 * 60 
});

const routeRateLimits = {
    '/api/test/heatlh': { windowSize: 60, maxRequests: 10 },
   
};

const rateLimiter = (req, res, next) => {
    const route = req.path;
    const rateLimitOptions = routeRateLimits[route];

    if (!rateLimitOptions) {
        return next();
    }

    const { windowSize, maxRequests } = rateLimitOptions;
    const key = `rate-limit:${route}:${req.ip}`;
    const now = Date.now();

  
    const cached = cache.get(key);
    if (cached) {
        if (now < cached.expiry && cached.count >= maxRequests) {
            return res.status(429).send('Too many requests. Please try again later.');
        } else if (now >= cached.expiry) {
            
            cached.count = 1;
            cached.expiry = now + windowSize * 1000;
        } else {
            cached.count += 1;
        }
        cache.set(key, cached);
        return next();
    }

   
    redis.multi()
        .incr(key)
        .ttl(key)
        .exec((err, replies) => {
            if (err) {
                console.error('Redis error:', err);
                return res.status(500).send('Internal server error');
            }

            const requestCount = replies[0][1];
            let ttl = replies[1][1];

            if (ttl === -1) {
                redis.expire(key, windowSize);
                ttl = windowSize;
            }

            if (requestCount > maxRequests) {
                cache.set(key, { count: requestCount, expiry: now + ttl * 1000 });
                return res.status(429).send('Too many requests. Please try again later.');
            }

            cache.set(key, { count: requestCount, expiry: now + ttl * 1000 });
            next();
        });
};

module.exports = rateLimiter;
