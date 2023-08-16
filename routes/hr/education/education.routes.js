const express = require("express");
const {
  createSingleEducation,
  getAllEducation,
  getSingleEducation,
  updateSingleEducation,
  deleteSingleEducation,
} = require("./education.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const educationRoutes = express.Router();

educationRoutes.post("/", authorize("create-education"), createSingleEducation);
educationRoutes.get("/", authorize("readAll-education"), getAllEducation);
educationRoutes.get("/:id", authorize(""), getSingleEducation);
educationRoutes.put(
  "/:id",
  authorize("update-education"),
  updateSingleEducation
);
educationRoutes.delete(
  "/:id",
  authorize("delete-education"),
  deleteSingleEducation
);

module.exports = educationRoutes;
