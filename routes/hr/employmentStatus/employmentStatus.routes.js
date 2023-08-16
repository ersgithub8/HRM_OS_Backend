const express = require("express");

const {
  createSingleEmployment,
  getAllEmployment,
  getSingleEmployment,
  deletedEmployment,
} = require("./employmentStatus.controller");
const authorize = require("../../../utils/authorize"); // authentication middleware

const employmentRoutes = express.Router();

employmentRoutes.post(
  "/",
  authorize("create-employmentStatus"),
  createSingleEmployment
);
employmentRoutes.get(
  "/",
  authorize("readAll-employmentStatus"),
  getAllEmployment
);
employmentRoutes.get(
  "/:id",
  authorize("readSingle-employmentStatus"),
  getSingleEmployment
);
employmentRoutes.put(
  "/:id",
  authorize("delete-employmentStatus"),
  deletedEmployment
);

module.exports = employmentRoutes;
