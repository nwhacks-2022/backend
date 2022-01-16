let express = require("express");
let cors = require("cors");
let bodyParser = require("body-parser");
const wpmRouter = require("./routes/wpm");
const Multer = require('multer');

const dotenv = require('dotenv')
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
app.use("/", (req, res, next) => {
  res.status(200).send("hello :)");
})
app.use("/wpm", multer.single('file'), wpmRouter);

let port = parseInt(process.env.PORT || "");
if (isNaN(port) || port === 0) {
  port = 3000;
}
app.listen(port);
console.log(`app running on port ${port}`);
