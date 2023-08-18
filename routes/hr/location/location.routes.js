const express = require("express");

const {
    createSingleLocation,
  getAllLocation,
  getSingleLocation,
  updateSingleLocation,
  deletedLocation,
} = require("./location.controller");
const authorize = require("../../../utils/authorize"); // authentication middleware

const locationRoutes = express.Router();

locationRoutes.post(
  "/",
//   authorize("create-location"),
  createSingleLocation
);
locationRoutes.get("/",
//  authorize("readAll-location"),
  getAllLocation);
locationRoutes.get("/:id",
//  authorize(""),
  getSingleLocation);
locationRoutes.put(
  "/:id",
//   authorize("update-department"),
  updateSingleLocation
);
locationRoutes.patch(
  "/:id",
//   authorize("delete-department"),
  deletedLocation
);

module.exports = locationRoutes;
