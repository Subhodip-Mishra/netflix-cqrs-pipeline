import { Queue } from 'bullmq';

export const videoQueue = new Queue('video-processing-queue', {
    connection: {
        host: process.env.REDIS_HOST || 'redis_db',
        port: 6379
    }
})