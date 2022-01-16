let express = require('express');
const fs = require('fs');
let { getWavName, makeWav, makeClip, getAudioLen, calculateWpm } = require('../helpers/audio');
const { saveRecording, saveData } = require('../helpers/data');
const getText = require('../helpers/speechtotext');
const variance = require('../helpers/variance');

const uploadDir = './uploads';

const cleanup = async (filepath) => {
  try{
    await new Promise((resolve, reject) => {
      fs.unlink(filepath, (err) => {
        if (err) reject();
        else resolve();
      });
    })
    console.log("removed " + filepath);
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
    if (!req.file.filename) {
      res.status(500).send("whoops, something went wrong!")
      return;
    }
    const filepath = `${uploadDir}/${req.file.filename}`;
    let cleanupList = [filepath];

    // convert to wav
    await makeWav(filepath);
    cleanupList.push(getWavName(filepath));

    // get text
    let text = await getText(filepath);

    // audio length
    const audiolen = await getAudioLen(getWavName(filepath));
    console.log("audiolen: ", audiolen);

    // wpm
    const wpm = calculateWpm(text, audiolen);

    // upload recording to azure storage
    const url = await saveRecording(filepath);

    // info
    const document = {
      link: url,
      text: text,
      question: req.body.question,
      duration: audiolen,
      wpm: wpm
    }

    // send response
    res.status(200).json(document)

    // calculate wpm for clips of the audio- goal is to see whether the wpm varies greatly across
    // the clip, which would mean a lot of pausing and talking quickly which may otherwise average out.
    // we will be taking 5 second clips.
    const clipLen = 5;
    const numClips = Math.floor(audiolen / clipLen);
    let wpms = [];
    for (let i = 0; i < numClips; i++) {
      // make clip
      const startTime = i * clipLen;
      const endTime = audiolen < (i+1) * clipLen ? audiolen : (i+1) * clipLen;
      const duration = endTime - startTime;

      const fp = await makeClip(getWavName(filepath), startTime, duration, i);
      cleanupList.push(fp);

      // get num words
      const cliptext = await getText(fp);

      // find wpm
      wpms.push(calculateWpm(cliptext, duration));
    }

    console.log("wpms:", wpms);

    const v = variance(wpms, wpm);

    document.variance = v;

    // save data to firestore collection
    await saveData(document);

    // clean up files
    for (let item of cleanupList) {
      await cleanup(item);
    }
  }
  catch(err) {
    console.log("ERROR:", err)
    res.status(500).send("Something went wrong. Please try again later.");
  }
});

module.exports = uploadRouter;
