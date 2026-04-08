import { Redis } from 'ioredis'

const subscriber = new Redis({
  host: process.env.REDIS_HOST || 'redis_db',
  port: 6379
})

// tell Redis which channel to listen to
subscriber.subscribe('video-ready', (err) => {
  if (err) console.error('Failed to subscribe:', err)
  else console.log('👂 Subscribed to video-ready channel')
})

// this fires every time worker publishes
subscriber.on('message', (channel, videoId) => {
  console.log(`🎉 Video is ready! ID: ${videoId}`)
  // later: send WebSocket to browser, update cache, send email
})