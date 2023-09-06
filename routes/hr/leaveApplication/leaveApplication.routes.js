const express = require("express");

const {
  createSingleLeave,
  getAllLeave,
  getSingleLeave,
  grantedLeave,
  getLeaveByUserId,
  deleteSingleLeave,
} = require("./leaveApplication.controller");
const authorize = require("../../../utils/authorize"); // authentication middleware

const leaveApplicationRoutes = express.Router();

leaveApplicationRoutes.post("/", authorize(""), createSingleLeave);
leaveApplicationRoutes.get("/", authorize(""), getAllLeave);
leaveApplicationRoutes.get("/:id", authorize(""), getSingleLeave);
leaveApplicationRoutes.put(
  "/:id",
  authorize("update-leaveApplication"),
  grantedLeave
);
leaveApplicationRoutes.get(
  "/:id/leaveHistory",
  authorize(""),
  getLeaveByUserId
);
leaveApplicationRoutes.patch("/:id", authorize(""), deleteSingleLeave);


module.exports = leaveApplicationRoutes;
