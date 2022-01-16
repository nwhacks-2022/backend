let express = require('express');
let { db, auth } = require('../../firebase.js');

let questionRouter = express.Router();

questionRouter.get("/", async (req, res, next) => {
  let count = req.query.count || 10;

  let questions = [];

  try {
    let results = await db.collection("question").get();
    questions = results.docs.map(doc => doc.data().question);
  }
  catch(err) {
    console.log(err)
    res.status(500).send("An error has occurred.");
  }

  // randomize and limit number of questions
  // scuffed randomizer
  questions.sort(() => Math.random() - 0.5);
  if (questions.length > count) {
    questions = questions.slice(0, count);
  }
  
  res.status(200).send(questions);
});

// takes req.body.question as a string
questionRouter.post("/", async (req, res, next) => {
  if (!req.body.question) {
    res.status(400).send("Please post a question.");
  }

  const question = {
    question: req.body.question
  }

  try {
    await db.collection("question").add(question);
    res.status(200).send();
  }
  catch(err) {
    console.log(err)
    res.status(500).send("An error has occurred.");
  }
});

module.exports = questionRouter;
