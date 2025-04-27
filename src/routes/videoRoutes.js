const express = require('express');
const router = express.Router();
const { upload, uploadVideo, trimVideo, addSubtitles , renderFinalVideo , downloadFinalVideo } = require('../controllers/videoController');

router.post('/upload', upload.single('video'), uploadVideo);
router.post('/:id/trim', trimVideo);
router.post('/:id/subtitles', addSubtitles);
router.post("/:id/render", renderFinalVideo); 
router.get("/:id/download", downloadFinalVideo);

module.exports = router;
