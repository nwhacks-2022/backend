let express = require("express");
let cors = require("cors");
let bodyParser = require("body-parser");
const uploadRouter = require("./routes/upload");
const Multer = require('multer');

const dotenv = require('dotenv');
const questionRouter = require("./routes/question");
const historyRouter = require("./routes/history");
dotenv.config()

// file info
const uploadDir = './uploads';

const multer = Multer({
  storage: Multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, callback) => {
      callback(null, Date.now() + ".webm")
    }
  })
});

const app = express();

app.use(express.static("public"))

app.use(cors());
app.use(bodyParser.json());

// routes
app.use("/upload", multer.single('file'), uploadRouter);
app.use("/question", questionRouter);
app.use("/history", historyRouter);

app.use("/", (req, res, next) => {
  res.status(200).send("hello :)");
})

let port = parseInt(process.env.PORT || "");
if (isNaN(port) || port === 0) {
  port = 3000;
}
app.listen(port);
console.log(`app running on port ${port}`);
