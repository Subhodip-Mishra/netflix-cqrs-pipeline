import express from 'express'
import type { Express } from 'express'
import videoRouter from "./routes/video.command.js"

const app: Express = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.use('/api/videos', videoRouter);

app.get('/health', (req, res) => {
  console.log("Health check endpoint hit");
  res.json({ status: 'ok' })
})

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

export default app;
