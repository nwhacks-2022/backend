let express = require('express');
const { getData } = require('../helpers/data');

let historyRouter = express.Router();

historyRouter.get("/", async (req, res, next) => {
  try {
    let results = await getData(req.query.count);

    res.status(200).send(results);
  }
  catch(err) {
    console.log("ERROR:", err);
    res.status(500).send("An error has occurred :(")
  }
})

module.exports = historyRouter;
