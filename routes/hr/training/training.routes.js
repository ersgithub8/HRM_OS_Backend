const express = require("express");
const {
    createSingleTraining,
    getAllTrining,
    getSingleTrining,
    updateSingleTrining,
    deleteSingleTrining,
} = require("./training.controller");

const trainingRoutes = express.Router();
const authorize = require("../../../utils/authorize"); // authentication middleware

trainingRoutes.post(
    "/",
    authorize("create-training"),
    createSingleTraining
  );
  trainingRoutes.get("/",
   authorize("readAll-training"),
   getAllTrining);
  trainingRoutes.get("/:id",
   authorize("readSingle-training"),
   getSingleTrining);
  trainingRoutes.put(
    "/:id",
    authorize("update-training"),
    updateSingleTrining
  );
  trainingRoutes.delete(
    "/:id",
    authorize("delete-training"),
    deleteSingleTrining
  );


module.exports = trainingRoutes;