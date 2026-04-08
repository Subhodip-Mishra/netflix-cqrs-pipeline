import db from "../db/index.js";
import { videoQueue } from "../queue/video.queue.js";
import { videos } from "../db/schema.js";

interface UploadVideocommand {
    file: {
        originalname: string;
        path: string;
    },
    title: string;
}

export async function uploadVideoCommand(input: UploadVideocommand) {
    try {
        const { file, title } = input;
        console.log("🚀 DEBUG: Starting DB Insert for title:", title);

        if (!file) throw new Error("No file uploaded");

        const [video] = await db.insert(videos).values({
            title,
            fileName: file.originalname,
            originalPath: file.path,
            status: "PENDING"
        }).returning();

        console.log("✅ DEBUG: DB Insert Success! ID:", video?.id);
        await videoQueue.add("process-video", {
            videoId: video?.id,
            filePath: video?.originalPath
        })

        console.log("✅ DEBUG: BullMQ Job Added!");
        return video;

    } catch (error) {
        console.error("Error uploading video:", error);
        throw error;
    }
}