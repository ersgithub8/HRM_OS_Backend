const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
//env
require("dotenv").config();

//connection with aws
const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  accessKeyId: process.env.aws_access_key_id,
  secretAccessKey: process.env.aws_secret_access_key,
  endpoint: process.env.s3endpoint,
  region: process.env.aws_region,
});

//for upload a file
let key;
const uploadFile = function (fileData, name) {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.s3bucketname,
      Key: name,
      Body: fileData.data,
      ACL: "public-read",
    };
    s3.upload(params, function (s3Err, data) {
      if (s3Err) {
        console.error("Error uploading to S3:", s3Err);
        reject(s3Err);
      } else {
        key = data.Location;
        resolve(key);
      }
    });
  });
};

// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 5 * 1024 * 1024, // limit file size to 5MB
//   },
// });

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
exports.uploadimages = async (req, res) => {
  if (req.files) {
    try {
      let name = "image_" + Date.now() + ".png";
      let fileKey = await uploadFile(req.files.image, name);

      let path = fileKey;
      return res.status(200).json({
        path: path,
        message: "Image Successfully Uploaded",
        error: false,
      });
    } catch (err) {
      return res.status(404).json({
        message: "Image Upload Failed " + err,
        error: true,
      });
    }
  } else {
    return res.status(404).json({
      message: "Image Upload Failed",
      error: true,
    });
  }
};

exports.delimage = async (req, res) => {
  try {
    if (req.body.image) {
      let img = req.body.image.split("/");
      s3.deleteObject(
        {
          Bucket: process.env.s3bucketname,
          Key: img[img.length - 1],
        },
        function (err, data) {
          if (err) {
            console.log(err);
            res.status(404).json({
              message: "Image Upload Failed " + err,
              error: true,
            });
          } else {
            console.log("image del");
            res.status(200).json({
              message: "Image Delete Successfully",
              error: false,
            });
          }
        }
      );
    }
  } catch (err) {
    console.log(err);
  }
};

// exports.file= async (req, res) => {
//   if (req.files) {
//     try {
//       const allowedExtensions = ['.pdf', '.xlsx', '.png'];
      

//       let name = "file_" + Date.now()+".pdf";
//       let fileKey = await uploadFile(req.files.file, name);

//       let path = fileKey;
//       return res.status(200).json({
//         path: path,
//         message: "File Successfully Uploaded",
//         error: false,
//       });
//     } catch (err) {
//       return res.status(404).json({
//         message: "Image Upload Failed " + err,
//         error: true,
//       });
//     }
//   } else {
//     return res.status(404).json({
//       message: 'File Upload Failed',
//       error: true,
//     });
//   }
// }



exports.file = async (req, res) => {
  if (req.files) {
    try {
     
      const allowedExtensions = ['.pdf', '.xlsx', '.csv', '.png', '.jpg', '.jpeg', '.gif'];

  
      const uploadedFile = req.files.file;

    
      const fileExtension = path.extname(uploadedFile.name).toLowerCase();

    
      if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({
          message: 'File type not allowed',
          error: true,
        });
      }

      // Generate a unique file name
      const uniqueFileName = `file_${Date.now()}${fileExtension}`;

      // Upload the file using your uploadFile function
      const fileKey = await uploadFile(uploadedFile, uniqueFileName);

      const filePath = fileKey; // Changed the variable name to filePath
      return res.status(200).json({
        path: filePath, // Updated variable name here as well
        message: 'File Successfully Uploaded',
        error: false,
      });
    } catch (err) {
      return res.status(500).json({
        message: 'File Upload Failed ' + err,
        error: true,
      });
    }
  } else {
    return res.status(400).json({
      message: 'File Upload Failed',
      error: true,
    });
  }
};




