let express = require('express');
const fs = require('fs');
let { getWavName, toWav, getAudioLen, calculateWpm } = require('../helpers/audio');
const getText = require('../helpers/speechtotext');

const uploadDir = './uploads';

const cleanup = async (filepath) => {
  try{
    await new Promise((resolve, reject) => {
      fs.unlink(filepath, (err) => {
        if (err) reject();
        else resolve();
      });
    })
  }
  catch(err) {
    console.log("ERROR:", err)
  }
}

let uploadRouter = express.Router();

uploadRouter.post("/", async (req, res, next) => {
  // file is in req.file
  if (!req.file) {
    res.status(400).json({
      message: "attach a file"
    })
  }

  try {
    const filepath = `${uploadDir}/${req.file.filename}`;
    // convert to wav
    await toWav(filepath);

    // get text
    let text = await getText(filepath);

    // audio length
    const audiolen = await getAudioLen(getWavName(filepath));
    console.log("audiolen: ", audiolen);

    // wpm
    const wpm = calculateWpm(text, audiolen);

    // clean up files
    await cleanup(filepath);
    await cleanup(getWavName(filepath));

    // send response
    res.status(200).json({
      text: text,
      wpm: wpm
    })
  }
  catch(err) {
    console.log("ERROR:", err)
    res.status(500).send("Something went wrong. Please try again later.");
  }
});

module.exports = uploadRouter;
