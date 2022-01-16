let express = require('express');
const fs = require('fs');
let { getWavName, toWav, getAudioLen, calculateWpm } = require('../helpers/audio');
const { saveRecording, saveData } = require('../helpers/data');
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
  if (!req.body.question) {
    res.status(400).json({
      message: "include a question"
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

    // upload recording to azure storage
    const url = await saveRecording(filepath);

    // clean up files
    await cleanup(filepath);
    await cleanup(getWavName(filepath));

    // info
    const document = {
      link: url,
      text: text,
      question: req.body.question,
      duration: audiolen,
      wpm: wpm
    }

    // save data to collection
    await saveData(document);

    // send response
    res.status(200).json(document)
  }
  catch(err) {
    console.log("ERROR:", err)
    res.status(500).send("Something went wrong. Please try again later.");
  }
});

module.exports = uploadRouter;
