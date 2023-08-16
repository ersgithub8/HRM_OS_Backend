const express = require("express");

const {
  createSingleLeavePolicy,
  getAllLeavePolicy,
  getSingeLeavePolicy,
  updateSingleLeavePolicy,
  deleteSingleLeavePolicy,
} = require("./leavePolicy.controller");
const authorize = require("../../../utils/authorize"); // authentication middleware

const leavePolicyRoutes = express.Router();

leavePolicyRoutes.post(
  "/",
  authorize("create-leavePolicy"),
  createSingleLeavePolicy
);
leavePolicyRoutes.get("/", authorize("readAll-leavePolicy"), getAllLeavePolicy);
leavePolicyRoutes.get(
  "/:id",
  authorize("readSingle-leavePolicy"),
  getSingeLeavePolicy
);
leavePolicyRoutes.put(
  "/:id",
  authorize("update-leavePolicy"),
  updateSingleLeavePolicy
);
leavePolicyRoutes.delete(
  "/:id",
  authorize("delete-leavePolicy"),
  deleteSingleLeavePolicy
);

module.exports = leavePolicyRoutes;
