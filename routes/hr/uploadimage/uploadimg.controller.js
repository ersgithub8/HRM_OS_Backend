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

// const uploadimages = async (req, res) => {
//   if (req.files) {
//     try {
//       const uploadedPaths = [];
//       const files = [];

//       if (req.files?.image){
//         let a = {
//           image: req.files.image,
//           name: "image"
//         }
//         files.push(a);
//       }
//       if (req.files?.firstaid){
//         let a = {
//           image: req.files.firstaid,
//           name: "firstaid"
//         }
//         files.push(a);
//       }
//       if (req.files?.dbscheck){
//         let a = {
//           image: req.files.dbscheck,
//           name: "dbscheck"
//         }
//         files.push(a);
//       }
//       if (req.files?.safeguard){
//         let a = {
//           image: req.files.safeguard,
//           name: "safeguard"
//         }
//         files.push(a);
//       }

//       if (files.length == 0){
//         return res.status(400).json({
//           message: "File Not Found.",
//           error: true,
//         });
//       }

      
//       for (const file of files) {
//         const ext = file.image.name.split('.').pop();
//         let fileType = file.name;

//         const name = fileType + "_" + Date.now() + "." + ext; s
//         const fileKey = await uploadFile(file.image, name);
//         uploadedPaths.push({
//           type: fileType,
//           path: fileKey
//         });
//       }

//       return res.status(200).json({
//         files: uploadedPaths,
//         message: "Files Successfully Uploaded",
//         error: false,
//       });
//     } catch (err) {
//       return res.status(404).json({
//         message: "File Upload Failed",
//         error: true,
//       });
//     }
//   } else {
//     return res.status(404).json({
//       message: "File Upload Failed",
//       error: true,
//     });
//   }
// };
const uploadimages = async (req, res) => {
  if (req.files) {
    try {
      const uploadedFiles = {}; // Initialize an object to store uploaded files

      if (req.files?.image) {
        const ext = req.files.image.name.split('.').pop();
        const name = "image_" + Date.now() + "." + ext;
        const fileKey = await uploadFile(req.files.image, name);
        uploadedFiles.image = {
          path: fileKey
        };
      }

      if (req.files?.firstaid) {
        const ext = req.files.firstaid.name.split('.').pop();
        const name = "firstaid_" + Date.now() + "." + ext;
        const fileKey = await uploadFile(req.files.firstaid, name);
        uploadedFiles.firstaid = {
          path: fileKey
        };
      }
      

      if (req.files?.dbscheck) {
        const ext = req.files.dbscheck.name.split('.').pop();
        const name = "dbscheck_" + Date.now() + "." + ext;
        const fileKey = await uploadFile(req.files.dbscheck, name);
        uploadedFiles.dbscheck = {
          path: fileKey
        };
      }

    
      if (req.files?.safeguard) {
        const ext = req.files.safeguard.name.split('.').pop();
        const name = "safeguard_" + Date.now() + "." + ext;
        const fileKey = await uploadFile(req.files.safeguard, name);
        uploadedFiles.safeguard = {
          path: fileKey
        };
      }
      if (req.files?.attachment) {
        const ext = req.files.attachment.name.split('.').pop();
        const name = "attachment_" + Date.now() + "." + ext;
        const fileKey = await uploadFile(req.files.attachment, name);
        uploadedFiles.attachment = {
          path: fileKey
        };
      }
      if (req.files?.adminattachment) {
        const ext = req.files.adminattachment.name.split('.').pop();
        const name = "attachment_" + Date.now() + "." + ext;
        const fileKey = await uploadFile(req.files.adminattachment, name);
        uploadedFiles.adminattachment = {
          path: fileKey
        };
      }
      if (req.files?.userAttachment) {
        const ext = req.files.userAttachment.name.split('.').pop();
        const name = "attachment_" + Date.now() + "." + ext;
        const fileKey = await uploadFile(req.files.userAttachment, name);
        uploadedFiles.userAttachment = {
          path: fileKey
        };
      }

      if (Object.keys(uploadedFiles).length === 0) {
        return res.status(400).json({
          message: "File Not Found.",
          error: true,
        });
      }

      return res.status(200).json({
        files: uploadedFiles,
        message: "Files Successfully Uploaded",
        error: false,
      });
    } catch (err) {
      return res.status(404).json({
        message: "File Upload Failed",
        error: true,
      });
    }
  } else {
    return res.status(404).json({
      message: "File Upload Failed",
      error: true,
    });
  }
};


const delimage = async (req, res) => {
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

module.exports = { uploadimages, delimage};

