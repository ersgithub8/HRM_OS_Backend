const express = require("express");

const {
  createSingleEmployment,
  getAllEmployment,
  getSingleEmployment,
  deletedEmployment,
  updateEmployment,
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
employmentRoutes.delete(
  "/:id",
  authorize("delete-employmentStatus"),
  deletedEmployment
);
employmentRoutes.put(
  "/:id",
  authorize("update-employmentStatus"),
  updateEmployment
);

module.exports = employmentRoutes;
