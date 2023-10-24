const express = require("express");
const {
  createShift,
  getAllShift,
  getSingleShift,
  updateSingleShift,
  deleteSingleShift,
  getSingleShiftbyuserId
} = require("./shifts.controller");
const authorize = require("../../utils/authorize"); // authentication middleware

const shiftsRoutes = express.Router();

shiftsRoutes.post("/", authorize("create-shift"), createShift);
shiftsRoutes.get("/", authorize("readAll-shift"), getAllShift);
shiftsRoutes.get("/:id", authorize("readSingle-shift"), getSingleShift);
shiftsRoutes.get("/user/:id", authorize("readSingle-shift"), getSingleShiftbyuserId);
shiftsRoutes.put("/update/:id", authorize("update-shift"), updateSingleShift);
shiftsRoutes.delete("/:id", authorize("delete-shift"), deleteSingleShift);
module.exports = shiftsRoutes;
