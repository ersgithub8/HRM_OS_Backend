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
  // getAllLeaveCTO,
} = require("./leaveApplication.controller");
const {
  createAttendanceonleave,
} = require("../attendance/attendance.controller");

const authorize = require("../../../utils/authorize"); // authentication middleware

const leaveApplicationRoutes = express.Router();

// leaveApplicationRoutes.get("/getAllLeaveCTO", authorize(""), getAllLeaveCTO);

leaveApplicationRoutes.post(
  "/",
  authorize("create-leaveApplication"),
  createSingleLeave
);
leaveApplicationRoutes.post(
  "/create",
  authorize("create-leaveApplication"),
  adminSingleLeave
);
leaveApplicationRoutes.get(
  "/",
  authorize("readAll-leaveApplication"),
  getAllLeave
);
leaveApplicationRoutes.get("/approve", authorize(""), getapprovedAllLeave);
leaveApplicationRoutes.get("/todayLeaveState", authorize(""), todayLeaveState);
leaveApplicationRoutes.get(
  "/yearlyLeaveState",
  authorize(""),
  yearlyLeaveState
);
leaveApplicationRoutes.get(
  "/monthlyapprove",
  authorize(""),
  MonthlyApprovedLeaves
);
leaveApplicationRoutes.get(
  "/:id",
  authorize("readSingle-leaveApplication"),
  getSingleLeave
);
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
