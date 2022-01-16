const { getAudioDurationInSeconds } = require('get-audio-duration');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const getWavName = (filename) => { return filename.replace(".webm", ".wav") }

// converts webm to wav
const makeWav = async (filepath) => {
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

// makes an audio clip
// returns filepath to new clip
const makeClip = async (filepath, start, dur, id) => {
  // make temp filename: starts with ./uploads
  const temp = filepath.split('.');
  const newfilepath = "." + temp[1] + "_" + id + ".wav";

  await new Promise((resolve, reject) => {
    ffmpeg(filepath)
      .setStartTime(start)
      .setDuration(dur)
      .output(newfilepath)
      .on('end', function() {
          resolve();
      }).on('error', function(err){
          reject(err);
      }).run();
  })
  return newfilepath;
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
  if (text === "") return 0; 
  const words = text.split(' ').length;
  return words / (audiolen / 60);
}

module.exports = { getWavName, makeWav, makeClip, getAudioLen, calculateWpm }
