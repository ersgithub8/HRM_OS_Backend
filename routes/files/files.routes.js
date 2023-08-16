const express = require("express");
const crypto = require("crypto"); // for generating random names
const multer = require("multer");
const { createFiles } = require("./files.controller");
const authorize = require("../../utils/authorize"); // authentication middleware

const filesRoutes = express.Router();

// generate random file name for extra security on naming
const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

// store files upload folder in disk
const path = require("path");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "routes/files/uploads/");
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);
    if (
      extension !== ".jpg" &&
      extension !== ".jpeg" &&
      extension !== ".png" &&
      extension !== ".pdf"
    ) {
      return cb(new Error("Only images and pdf are allowed"));
    } else if (extension === ".pdf") {
      const uniqueSuffix = generateFileName();
      cb(null, uniqueSuffix + ".pdf");
    } else {
      const uniqueSuffix = generateFileName();
      cb(null, uniqueSuffix + ".jpg");
    }
  },
});
// multer middleware
const upload = multer({ storage: storage });

// create new image
filesRoutes.post("/", upload.array("files", 1), createFiles);

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
