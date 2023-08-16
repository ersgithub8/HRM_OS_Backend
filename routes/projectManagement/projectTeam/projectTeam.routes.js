const express = require("express");
const projectTeamRoutes = express.Router();
const {
  createProjectTeam,
  getAllProjectTeam,
  getProjectTeamById,
  getProjectTeamByProjectId,
  updateProjectTeam,
  deleteProjectTeam,
} = require("./projectTeam.controller");
const authorize = require("../../../utils/authorize");

projectTeamRoutes.post("/", authorize("create-projectTeam"), createProjectTeam);
projectTeamRoutes.get("/", authorize("readAll-projectTeam"), getAllProjectTeam);
projectTeamRoutes.get(
  "/:id/project",
  authorize("readAll-projectTeam"),
  getProjectTeamByProjectId
);
projectTeamRoutes.get(
  "/:id",
  authorize("readSingle-projectTeam"),
  getProjectTeamById
);
projectTeamRoutes.put(
  "/:id",
  authorize("update-projectTeam"),
  updateProjectTeam
);
projectTeamRoutes.patch(
  "/:id",
  authorize("delete-projectTeam"),
  deleteProjectTeam
);

module.exports = projectTeamRoutes;
