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
  if (!req.file) {
    res.status(400).json({
      message: "attach a file"
    })
  }

  try {
    const filepath = `${uploadDir}/${req.file.filename}`;
    // convert
    await toWav(filepath);

    // azure speech to text
    const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_KEY, process.env.AZURE_LOCATION);
    
    let audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(getWavName(filepath)));
    let recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    let text = await new Promise((resolve, reject) => {
      let result = "";
      
      recognizer.recognized = (s, e) => {
        if (e.result.reason == sdk.ResultReason.RecognizedSpeech) {
          console.log(`RECOGNIZED: Text=${e.result.text}`);
          result += " " + e.result.text;
        }
        else if (e.result.reason == sdk.ResultReason.NoMatch) {
          console.log("NOMATCH: Speech could not be recognized.");
        }
      };
      
      recognizer.canceled = (s, e) => {
        console.log(`CANCELED: Reason=${e.reason}`);
    
        if (e.reason == sdk.CancellationReason.Error) {
          console.log(`CANCELED: ErrorCode=${e.errorCode}`);
          console.log(`CANCELED: ErrorDetails=${e.errorDetails}`);
          reject();
        }

        recognizer.stopContinuousRecognitionAsync();
        result = result.substring(1);
        resolve(result);
      };
      
      recognizer.sessionStopped = (s, e) => {
        console.log("\n    Session stopped event.");
        recognizer.stopContinuousRecognitionAsync();
        result = result.substring(1);
        resolve(result);
      };

      recognizer.startContinuousRecognitionAsync();
    });

    const audiolen = await getAudioLen(getWavName(filepath));
    console.log("audiolen: ", audiolen)

    const wpm = calculateWpm(text, audiolen);

    // clean up files
    try{
      await new Promise((resolve, reject) => {
        fs.unlink(filepath, (err) => {
          if (err) reject();
          fs.unlink(getWavName(filepath), (errr) => {
            if (errr) reject();
            else resolve();
          });
        });
      })
    }
    catch(err) {
      console.log("ERROR:", err)
    }

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

module.exports = wpmRouter;
