const express = require("express");
const {
  createSingleDesignationHistory,
  getAllDesignationHistory,
  getSingleDesignationHistory,
  updateSingleDesignationHistory,
  deleteSingleDesignationHistory,
} = require("./designationHistory.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const designationHistoryRoutes = express.Router();

designationHistoryRoutes.post(
  "/",
  authorize("create-designationHistory"),
  createSingleDesignationHistory
);
designationHistoryRoutes.get(
  "/",
  authorize("readAll-designationHistory"),
  getAllDesignationHistory
);
designationHistoryRoutes.get(
  "/:id",
  authorize("readSingle-designationHistory"),
  getSingleDesignationHistory
);
designationHistoryRoutes.put(
  "/:id",
  authorize("update-designationHistory"),
  updateSingleDesignationHistory
);
designationHistoryRoutes.delete(
  "/:id",
  authorize("delete-designationHistory"),
  deleteSingleDesignationHistory
);

module.exports = designationHistoryRoutes;
