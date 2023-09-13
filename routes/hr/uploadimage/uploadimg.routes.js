const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const AWS = require("aws-sdk");
const imageRoutes = express.Router();
const {
  uploadimages,delimage,
} = require("./uploadimg.controller");

const bucketName = process.env.s3bucketname;

const awsConfig = {
  accessKeyId: process.env.aws_access_key_id,
  secretAccessKey: process.env.aws_secret_access_key,
  endpoint: process.env.s3endpoint,
  region: process.env.aws_region,
};




//Specify the multer config
let upload = multer({
    // storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 5,
    },
    fileFilter: function (req, file, done) {
        if (
            file.mimetype === "image/jpeg" ||
            file.mimetype === "image/png" ||
            file.mimetype === "image/jpg"
        ) {
            done(null, true);
        } else {
            //prevent the upload
            var newError = new Error("File type is incorrect");
            newError.name = "MulterError";
            done(newError, false);
        }
    },
});

//upload to s3


imageRoutes.post("/", uploadimages);

imageRoutes.post("/delete",  delimage);

module.exports = imageRoutes;
