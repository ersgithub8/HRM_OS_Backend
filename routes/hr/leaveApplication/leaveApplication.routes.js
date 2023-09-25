const express = require("express");

const {
  createSingleLeave,
  getAllLeave,
  getSingleLeave,
  grantedLeave,
  getLeaveByUserId,
  deleteSingleLeave,
  adminSingleLeave,
  getapprovedAllLeave,
  todayLeaveState,
  yearlyLeaveState,
  MonthlyApprovedLeaves,
} = require("./leaveApplication.controller");
const {
  createAttendanceonleave
} = require("../attendance/attendance.controller");

const authorize = require("../../../utils/authorize"); // authentication middleware

const leaveApplicationRoutes = express.Router();

leaveApplicationRoutes.post("/", authorize(""), createSingleLeave);
leaveApplicationRoutes.post("/create", authorize(""), adminSingleLeave);
leaveApplicationRoutes.get("/", authorize(""), getAllLeave);
leaveApplicationRoutes.get("/approve", authorize(""), getapprovedAllLeave);
leaveApplicationRoutes.get("/todayLeaveState", authorize(""), todayLeaveState);
leaveApplicationRoutes.get("/yearlyLeaveState", authorize(""), yearlyLeaveState);
leaveApplicationRoutes.get("/monthlyapprove", authorize(""), MonthlyApprovedLeaves);
leaveApplicationRoutes.get("/:id", authorize(""), getSingleLeave);
leaveApplicationRoutes.put(
  "/:id",
  authorize("update-leaveApplication"),
  grantedLeave,
  createAttendanceonleave
);
leaveApplicationRoutes.get(
  "/:id/leaveHistory",
  authorize(""),
  getLeaveByUserId
);
leaveApplicationRoutes.patch("/:id", authorize(""), deleteSingleLeave);


module.exports = leaveApplicationRoutes;
