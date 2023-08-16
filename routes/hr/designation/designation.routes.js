const express = require("express");
const {
  createSingleDesignation,
  getAllDesignation,
  getSingleDesignation,
  updateSingleDesignation,
  allDesignationWiseEmployee,
  singleDesignationWiseEmployee,
  deleteSingleDesignation,
} = require("./designation.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const designationRoutes = express.Router();
designationRoutes.get(
  "/employee",
  authorize("readAll-designation"),
  allDesignationWiseEmployee
);
designationRoutes.get(
  "/employee/:id",
  authorize("readSingle-designation"),
  singleDesignationWiseEmployee
);
designationRoutes.post(
  "/",
  authorize("create-designation"),
  createSingleDesignation
);
designationRoutes.get("/", authorize("readAll-designation"), getAllDesignation);
designationRoutes.get(
  "/:id",
  authorize("readSingle-designation"),
  getSingleDesignation
);
designationRoutes.put(
  "/:id",
  authorize("update-designation"),
  updateSingleDesignation
);

designationRoutes.delete(
  "/:id",
  authorize("delete-designation"),
  deleteSingleDesignation
);

module.exports = designationRoutes;
