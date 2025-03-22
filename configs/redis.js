import 'dotenv/config';
import redis from 'redis';

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Error:', err));

redisClient.connect()
    .then(() => console.log('Connected to Redis'))
    .catch(console.error);

export default redisClient;
