const { getAudioDurationInSeconds } = require('get-audio-duration');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

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

module.exports = { getWavName, toWav, getAudioLen, calculateWpm }
