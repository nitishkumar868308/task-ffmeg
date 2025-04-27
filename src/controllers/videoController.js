const multer = require("multer");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const ffprobeInstaller = require("@ffprobe-installer/ffprobe");
const prisma = require("../config/db");
const fs = require("fs");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Upload function
const uploadVideo = async (req, res) => {
  try {
    const { file } = req;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const metadata = await getVideoMetadata(file.path);

    const video = await prisma.video.create({
      data: {
        name: file.filename,
        path: file.path,
        size: file.size,
        duration: metadata.duration,
        status: "uploaded",
      },
    });

    res.status(201).json({ message: "Video uploaded successfully", video });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};

// Video MetaData
const getVideoMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve({ duration: metadata.format.duration });
    });
  });
};

// Trim Video
const trimVideo = async (req, res) => {
  const { id } = req.params;
  const { start, end } = req.body;

  try {
    const video = await prisma.video.findUnique({
      where: { id: parseInt(id) },
    });
    if (!video) return res.status(404).json({ message: "Video not found" });

    const inputPath = video.path;
    const trimmedFileName = `trimmed_${Date.now()}.mp4`;
    const outputPath = path.join("uploads", trimmedFileName);

    ffmpeg(inputPath)
      .setStartTime(start)
      .setDuration(end - start)
      .output(outputPath)
      .on("end", async () => {
        const updated = await prisma.video.update({
          where: { id: video.id },
          data: {
            path: outputPath,
            status: "trimmed",
          },
        });
        res
          .status(200)
          .json({ message: "Trimmed successfully", video: updated });
      })
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        res
          .status(500)
          .json({ message: "Trimming failed", error: err.message });
      })
      .run();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Video Subtitles
const addSubtitles = async (req, res) => {
  const { id } = req.params;
  const { text, start, end } = req.body;

  try {
    const video = await prisma.video.findUnique({
      where: { id: parseInt(id) },
    });
    if (!video) return res.status(404).json({ message: "Video not found" });

    const inputPath = video.path;
    const subtitleFilePath = `uploads/sub_${Date.now()}.srt`;
    const outputPath = `uploads/subtitled_${Date.now()}.mp4`;

    const startFormatted = `00:00:${String(start).padStart(2, "0")},000`;
    const endFormatted = `00:00:${String(end).padStart(2, "0")},000`;

    const subtitleContent = `1
${startFormatted} --> ${endFormatted}
${text}

`;

    fs.writeFileSync(subtitleFilePath, subtitleContent);

    ffmpeg(inputPath)
      .outputOptions([
        "-vf",
        `subtitles='${subtitleFilePath.replace(/\\/g, "/")}'`,
      ])
      .on("end", async () => {
        const updated = await prisma.video.update({
          where: { id: video.id },
          data: {
            path: outputPath,
            status: "subtitled",
          },
        });
        res.status(200).json({ message: "Subtitles added", video: updated });
      })
      .on("error", (err) => {
        console.error("Subtitle Error:", err);
        res
          .status(500)
          .json({ message: "Subtitle processing failed", error: err.message });
      })
      .save(outputPath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Final Video
const renderFinalVideo = async (req, res) => {
  const { id } = req.params;

  try {
    const video = await prisma.video.findUnique({
      where: { id: parseInt(id) },
    });

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const finalInputPath = video.path;
    const finalFileName = `final_${Date.now()}.mp4`;
    const finalOutputPath = path.join("uploads", finalFileName);

    fs.copyFile(finalInputPath, finalOutputPath, async (err) => {
      if (err) {
        console.error("Error copying file:", err);
        return res.status(500).json({
          message: "Failed to render final video",
          error: err.message,
        });
      }

      const updatedVideo = await prisma.video.update({
        where: { id: video.id },
        data: {
          status: "rendered",
          path: finalOutputPath,
        },
      });

      res
        .status(200)
        .json({ message: "Final video rendered", video: updatedVideo });
    });
  } catch (error) {
    console.error("Render error:", error);
    res
      .status(500)
      .json({ message: "Failed to render final video", error: error.message });
  }
};

// Download Video
const downloadFinalVideo = async (req, res) => {
  const { id } = req.params;

  try {
    const video = await prisma.video.findUnique({
      where: { id: parseInt(id) },
    });

    if (!video || video.status !== "rendered") {
      return res
        .status(404)
        .json({ message: "Video not found or not yet rendered" });
    }

    const filePath = video.path;
    const fileName = path.basename(filePath);

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Download error:", err);
        return res
          .status(500)
          .json({ message: "Failed to download video", error: err.message });
      }
    });
  } catch (error) {
    console.error("Database error:", error);
    res
      .status(500)
      .json({ message: "Failed to download video", error: error.message });
  }
};

module.exports = {
  upload,
  uploadVideo,
  trimVideo,
  addSubtitles,
  renderFinalVideo,
  downloadFinalVideo,
};
