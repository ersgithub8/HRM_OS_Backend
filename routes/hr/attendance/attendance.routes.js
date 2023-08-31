const express = require("express");

const {
  createAttendance,
  getAllAttendance,
  getSingleAttendance,
  getAttendanceByUserId,
  getLastAttendanceByUserId,
  updateSingleAttendence,
  deleteSingleAttendence,
  getTodayAttendanceByUserId,
  createadminAttendance,

} = require("./attendance.controller");
const authorize = require("../../../utils/authorize"); // authentication middleware

const attendanceRoutes = express.Router();

attendanceRoutes.post("/", authorize(""), createAttendance);
attendanceRoutes.post("/create", authorize(""), createadminAttendance);
attendanceRoutes.get("/", authorize(""), getAllAttendance);
attendanceRoutes.get("/:id", authorize(""), getSingleAttendance);
attendanceRoutes.get("/:id/user", authorize(""), getAttendanceByUserId);
attendanceRoutes.get("/:id/last", authorize(""), getLastAttendanceByUserId);
attendanceRoutes.get("/:id/today", authorize(""), getTodayAttendanceByUserId);

attendanceRoutes.put(
  "/:id",
  authorize(""),
  updateSingleAttendence
);
attendanceRoutes.delete(
  "/:id",
  authorize(""),
  deleteSingleAttendence
);
module.exports = attendanceRoutes;
