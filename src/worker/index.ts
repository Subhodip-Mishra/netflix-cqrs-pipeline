import { Worker, Job } from 'bullmq';
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "fs/promises";
import db from '../db/index.js';
import { videos } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { Redis } from 'ioredis'

const redis = new Redis({
    host: process.env.REDIS_HOST || 'redis_db',
    port: 6379
})
const execAsync = promisify(exec);

const qualities = [
    { name: '1080p', scale: '1920:1080' },
    { name: '720p', scale: '1280:720' },
    { name: '480p', scale: '854:480' },
    { name: '360p', scale: '640:360' },
]

export const videoWorker = new Worker('video-processing-queue', async (job: Job) => {
    const { videoId, filePath } = job.data;

    console.log(`Processing video ID: ${videoId} at path: ${filePath}`);

    const outputDir = `/storage/processed/${videoId}`;
    await fs.mkdir(outputDir, { recursive: true });


    for (const q of qualities) {
        await execAsync(`ffmpeg -i ${filePath} -vf scale=${q.scale} -hls_segment_filename "${outputDir}/${q.name}_%03d.ts" -hls_list_size 0 -f hls ${outputDir}/${q.name}.m3u8`)
        console.log(`✅ ${q.name} done`)
    }
    const masterPlaylist = `#EXTM3U
            #EXT-X-VERSION:3
            #EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
            1080p.m3u8
            #EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
            720p.m3u8
            #EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480
            480p.m3u8
            #EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
            360p.m3u8`

    await fs.writeFile(`${outputDir}/master.m3u8`, masterPlaylist)
    console.log(`✅ Master playlist created`)


    await db.update(videos)
        .set({
            status: "PROCESSED",
            streamUrl: `/storage/processed/${videoId}/master.m3u8`
        })
        .where(eq(videos.id, videoId));

    redis.publish('video-ready', videoId)
    console.log(`✅ Video processing complete for ID: ${videoId}`)

}, {
    connection: {
        host: process.env.REDIS_HOST || 'redis_db',
        port: 6379
    }
})
