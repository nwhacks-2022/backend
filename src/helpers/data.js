let { db, auth } = require('../../firebase.js');
const { v1: uuidv1} = require('uuid');
const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs');

const saveData = async (doc) => {
  doc.timestamp = new Date().getTime();
  await db.collection("data").add(doc);
}

const getData = async (limit) => {
  let results = await db.collection("data").get();
  results = results.docs.map(doc => doc.data());

  if (isNaN(parseInt(limit))) limit = 50;
  if (results.length > limit) results = results.slice(0, limit);
  
  // reverse chronological
  results.sort((a, b) => b.timestamp - a.timestamp);
  return results;
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
