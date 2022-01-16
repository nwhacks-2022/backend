const fs = require('fs');
const sdk = require("microsoft-cognitiveservices-speech-sdk");
let { getWavName } = require('../helpers/audio');

// communicates with azure to get the text from an audio file
const getText = async (filepath) => {
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
      result = result.substring(1); // remove leading space
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

  return text;
}

module.exports = getText;
