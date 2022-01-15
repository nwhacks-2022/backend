let express = require('express');
const fs = require('fs');
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);
const { getAudioDurationInSeconds } = require('get-audio-duration');

const uploadDir = './uploads';

let wpmRouter = express.Router();

const getWavName = (filename) => { return filename.replace(".webm", ".wav") }

// converts webm to wav
const toWav = async (filepath) => {
  const newfilepath = getWavName(filepath);
  
  return new Promise((resolve, reject) => {
    try {
      ffmpeg(filepath)
      .output(newfilepath)
      .on('end', function() {                    
          console.log('conversion ended');
          resolve();
      }).on('error', function(err){
          reject(err);
      }).run();
    } catch (err) {
      reject(err);
    }
  });
}

// gets the length of the audio clip in seconds
const getAudioLen = async (filepath) => {
  console.log(filepath)
  try{
    let time = await new Promise((resolve, reject) => {
      getAudioDurationInSeconds(filepath).then((duration) => {
        resolve(duration)
      });
    });
    return time;
  }
  catch(err) {
    console.log("ERROR:", err)
  }
}

// calcuates words per minute
const calculateWpm = (text, audiolen) => {
  const words = text.split(' ').length;
  return words / (audiolen / 60);
}

wpmRouter.get("/", async (req, res, next) => {
  // file is in req.file

  try {
    const filepath = `${uploadDir}/${req.file.filename}`;
    // convert
    await toWav(filepath);

    // azure speech to text
    const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_KEY, process.env.AZURE_LOCATION);
    
    let audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(getWavName(filepath)));
    let recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    let text = await new Promise((resolve, reject) => {
      recognizer.recognizeOnceAsync(resultt => {
        console.log(`RECOGNIZED: Text=${resultt.text}`);
        recognizer.close();
        resolve(resultt.text);
      });
    });

    const audiolen = await getAudioLen(getWavName(filepath));
    console.log("audiolen: ", audiolen)

    const wpm = calculateWpm(text, audiolen);

    // send response
    res.status(200).json({
      text: text,
      wpm: wpm
    })
  }
  catch(err) {
    console.log("ERROR:", err)
  }
});

module.exports = wpmRouter;
