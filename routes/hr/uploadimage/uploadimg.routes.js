const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Require the controllers WHICH WE DID NOT CREATE YET!!
const controllerimg = require("../../../routes/hr/uploadimage/uploadimg.controller");


//for client image upload
const storageclient = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilterclient = (req, file, cb) => {
  const allowedFileTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/GIF",
    "image/svg+xml",
  ];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

let clientimage = multer({
  storage: storageclient,
  fileFilter: fileFilterclient,
});

router.post("/", controllerimg.uploadimages);
// router.post("/file", controllerimg.file);

router.post("/delete",  controllerimg.delimage);

module.exports = router;
