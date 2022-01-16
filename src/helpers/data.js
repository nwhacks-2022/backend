let { db, auth } = require('../../firebase.js');
const { v1: uuidv1} = require('uuid');
const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs');

// saves document to firestore, returns id of the created document
const saveData = async (doc) => {
  doc.timestamp = new Date().getTime();
  let docRef = await db.collection("data").add(doc);
  return docRef.id;
}

// saves document to firestore
const getData = async (limit) => {
  let results = await db.collection("data").get();
  results = results.docs.map(doc => doc.data());

  if (isNaN(parseInt(limit))) limit = 50;

  // reverse chronological
  results.sort((a, b) => b.timestamp - a.timestamp);
  
  if (results.length > limit) results = results.slice(0, limit);

  return results;
}

// updates variance of a document
const patchVariance = async (docId, variance) => {
  await db.collection("data").doc(docId).update({ variance: variance })
}

// save recording blob to azure
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

module.exports = { saveData, getData, patchVariance, saveRecording }
