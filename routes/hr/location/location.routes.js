const express = require("express");

const {
    createSingleLocation,
  getAllLocation,
  getSingleLocation,
  updateSingleLocation,
  deletedLocation,
  getfullLocation,
} = require("./location.controller");
const authorize = require("../../../utils/authorize"); // authentication middleware

const locationRoutes = express.Router();

locationRoutes.post(
  "/addlocation",
  authorize("create-location"),
  createSingleLocation
);
locationRoutes.get("/",
 authorize("readAll-location"),
  getAllLocation);
locationRoutes.get("/:id",
 authorize("readSingle-location"),
  getSingleLocation);
  locationRoutes.get("/full/:id",
 authorize("readSingle-location"),
 getfullLocation);
locationRoutes.put(
  "/:id",
  authorize("update-location"),
  updateSingleLocation
);
locationRoutes.delete(
  "/:id",
  authorize("delete-location"),
  deletedLocation
);

module.exports = locationRoutes;
