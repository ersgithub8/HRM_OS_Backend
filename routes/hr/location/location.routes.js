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
  "/addlocation",
  authorize(""),
  createSingleLocation
);
locationRoutes.get("/",
 authorize(""),
  getAllLocation);
locationRoutes.get("/:id",
 authorize(""),
  getSingleLocation);
locationRoutes.put(
  "/:id",
  authorize(""),
  updateSingleLocation
);
locationRoutes.patch(
  "/:id",
  authorize(""),
  deletedLocation
);

module.exports = locationRoutes;
