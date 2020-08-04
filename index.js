const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const SpeechToTextV1 = require("ibm-watson/speech-to-text/v1");
const {IamAuthenticator} = require("ibm-watson/auth");
const ejs = require("ejs");
const keys = require("./keys");

var fileName;
var extension;

const app = express();
app.set("view engine", "ejs");
app.use(express.json());

app.use(express.urlencoded({extended: true}));

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index", {transcript: "", confidence: ""});
});

const speechToText = new SpeechToTextV1({
  authenticator: new IamAuthenticator({
    apikey: keys.key,
  }),
  url: keys.url,
});

var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./audio");
  },
  filename: function (req, file, callback) {
    //callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    //callback(null, file.originalname)
    fileName = file.originalname;
    extension = path.extname(file.originalname).split(".")[1];
    callback(null, file.originalname);
  },
});
var upload = multer({
  storage: storage,
});

app.post("/upload", upload.single("upload"), (req, res) => {
  res.redirect("/done");
});

app.get("/done", async (req, res) => {
  const params = {
    // From file
    audio: fs.createReadStream(`./audio/${fileName}`),
    contentType: `audio/${extension}; rate=44100`,
  };

  const response = await speechToText.recognize(params);

  const {transcript, confidence} = response.result.results[0].alternatives[0];

  res.render("index", {
    transcript,
    confidence: `Below is the transcript with a confidence of ${confidence}`,
  });
});

app.listen(3000, () => {
  console.log("server is up");
});
