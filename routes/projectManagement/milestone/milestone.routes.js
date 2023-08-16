const express = require("express");

const {
  createMilestone,
  getAllMilestones,
  getMilestoneById,
  getMilestoneByProjectId,
  updateMilestone,
  deleteMilestone,
} = require("./milestone.controller");
const authorize = require("../../../utils/authorize"); // authentication middleware

const milestoneRoutes = express.Router();

milestoneRoutes.post("/", authorize("create-milestone"), createMilestone);
milestoneRoutes.get("/", authorize("readAll-milestone"), getAllMilestones);
milestoneRoutes.get(
  "/:id/project",
  authorize("readAll-milestone"),
  getMilestoneByProjectId
);
milestoneRoutes.get(
  "/:id",
  authorize("readSingle-milestone"),
  getMilestoneById
);
milestoneRoutes.put("/:id", authorize("update-milestone"), updateMilestone);
milestoneRoutes.patch("/:id", authorize("delete-milestone"), deleteMilestone);

module.exports = milestoneRoutes;
