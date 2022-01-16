let { db, auth } = require('../../firebase.js');
const { v1: uuidv1} = require('uuid');
const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs');

const saveData = async (link, text, question, audiolen, wpm) => {
  const document = {
    link: link,
    text: text,
    question: question,
    duration: audiolen,
    wpm: wpm
  }

  await db.collection("data").add(document);
}

const getData = async () => {
  let results = await db.collection("data").get();
  return results.docs.map(doc => doc.data());
}

const saveRecording = async (filepath) => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient("recordings");
  const blobName = 'recordingblob' + uuidv1() + '.wav';
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  let blob = await new Promise((resolve, reject) => {
    fs.readFile(filepath, (error, data) => {
      if(error) {
        reject();
      }
      console.log(data);
      resolve(data)
    });
  })

  const uploadBlobResponse = await blockBlobClient.upload(blob, blob.length);

  console.log("Blob was uploaded successfully. uploadBlobResponse: ", uploadBlobResponse);

  const url = "https://talko.blob.core.windows.net/recordings/" + blobName;

  return url;
}

module.exports = { saveData, getData, saveRecording }
