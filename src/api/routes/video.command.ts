import { randomUUID } from "node:crypto";
import multer from "multer";
import express, { Router } from 'express';
import { uploadVideoCommand } from "../../commands/upload-video.js";
import path from "node:path";

const router: Router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/storage/uploads');
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const uniqueName = `${randomUUID()}${ext}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

router.post("/upload", upload.single('video'), async (req, res) => {
if (!req.file) {
        return res.status(400).json({ error: "No file was saved. Check your storage config!" });
    }
    try {
        console.log("File saved to:", req.file.path);

        const result = await uploadVideoCommand({
            file: req.file,
            title: req.body.title || "Untitled Video"
        })

        return res.json({
            message: "Video Uploaded Successfully",
            video: result
        })

    } catch (error) {
        console.error("Error handling file upload:", error);
        return res.status(500).json({ message: "Internal server error" });
    }

});

export default router;