const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const AWS = require('aws-sdk');
const { createFiles } = require("./files.controller");
const authorize = require("../../utils/authorize"); // authentication middleware

const filesRoutes = express.Router();
AWS.config.update({
  accessKeyId: process.env.aws_access_key_id,
  secretAccessKey: process.env.aws_secret_access_key,
  endpoint: process.env.s3endpoint,
  region: process.env.aws_region,
});

const s3 = new AWS.S3();



const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// create new image
filesRoutes.post("/", upload.array("image", 5), createFiles);

//to serve single image from disk
filesRoutes.get("/:id", (req, res) => {
  res.sendFile(__dirname + "/uploads/" + req.params.id, (err) => {
    if (err) {
      res.status(404).send("Not found");
    }
  });
});

//get all images
const fs = require("fs");
filesRoutes.get("/", (req, res) => {
  fs.readdir(__dirname + "/uploads", (err, files) => {
    if (err) {
      return res.status(500).send("Unable to read directory: " + err);
    }
    return res.status(200).json({ files });
  });
});

module.exports = filesRoutes;
