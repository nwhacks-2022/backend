# talko backend

A project for nwHacks 2022

## Made using
- Nodejs
- Express
- Microsoft Azure
- Google Cloud Firestore

## Usage
### /upload
- POST: returns object with recording data. Saves recording and uploads data to Microsoft Azure Storage
  - file: .webm audio blob
  - question: question as a string
### /question
- GET: returns array of questions
- POST: uploads a single question to Google Firestore
  - question: question as a string
### /history
- GET: returns a list of data objects that have been saved

## Data
- link to recording in Azure
- audio duration
- words per minute
- text
- question
