const multer = require("multer");
const path = require("path");

//for client image upload
const storageclient = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/clients");
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

module.exports = clientimage;
