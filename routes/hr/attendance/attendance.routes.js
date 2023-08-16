const express = require("express");

const {
  createAttendance,
  getAllAttendance,
  getSingleAttendance,
  getAttendanceByUserId,
  getLastAttendanceByUserId,
} = require("./attendance.controller");
const authorize = require("../../../utils/authorize"); // authentication middleware

const attendanceRoutes = express.Router();

attendanceRoutes.post("/", authorize(""), createAttendance);
attendanceRoutes.get("/", authorize(""), getAllAttendance);
attendanceRoutes.get("/:id", authorize(""), getSingleAttendance);
attendanceRoutes.get("/:id/user", authorize(""), getAttendanceByUserId);
attendanceRoutes.get("/:id/last", authorize(""), getLastAttendanceByUserId);

module.exports = attendanceRoutes;
