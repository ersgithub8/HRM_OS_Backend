const express = require("express");
const {
  createShift,
  getAllShift,
  getSingleShift,
  updateSingleShift,
  deleteSingleShift,
  getSingleShiftbyuserId,
  swapSingleShift,
  getAllShiftmobile
  
} = require("./shifts.controller");
const authorize = require("../../utils/authorize"); // authentication middleware

const shiftsRoutes = express.Router();

shiftsRoutes.post("/", authorize("create-shifts"), createShift);
shiftsRoutes.post("/swap", authorize("create-shifts"), swapSingleShift);
shiftsRoutes.get("/", authorize("readAll-shifts"), getAllShift);
shiftsRoutes.get("/userside", authorize("readAll-shifts"), getAllShiftmobile);
shiftsRoutes.get("/:id", authorize("readSingle-shifts"), getSingleShift);
shiftsRoutes.get("/user/:id", authorize("readSingle-shifts"), getSingleShiftbyuserId);
shiftsRoutes.put("/update/:id", authorize("update-shifts"), updateSingleShift);
shiftsRoutes.delete("/delete/:id", authorize("delete-shifts"), deleteSingleShift);
module.exports = shiftsRoutes;
