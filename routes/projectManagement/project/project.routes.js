const express = require("express");

const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("./project.controller");
const authorize = require("../../../utils/authorize"); // authentication middleware

const projectRoutes = express.Router();

projectRoutes.post("/", authorize("create-project"), createProject);
projectRoutes.get("/", authorize("readAll-project"), getAllProjects);
projectRoutes.get("/:id", authorize("readSingle-project"), getProjectById);
projectRoutes.put("/:id", authorize("update-project"), updateProject);
projectRoutes.patch("/:id", authorize("delete-project"), deleteProject);

module.exports = projectRoutes;
