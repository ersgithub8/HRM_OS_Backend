const express = require("express");
const taskStatusRoutes = express.Router();
const {
  createTaskStatus,
  getAllTaskStatus,
  getTaskStatusById,
  getTaskStatusByProjectId,
  updateTaskStatus,
  deleteTaskStatus,
} = require("./taskStatus.controller");
const authorize = require("../../../utils/authorize");

taskStatusRoutes.post("/", authorize("create-taskStatus"), createTaskStatus);
taskStatusRoutes.get("/", authorize("readAll-taskStatus"), getAllTaskStatus);
taskStatusRoutes.get(
  "/:id/project",
  authorize("readAll-taskStatus"),
  getTaskStatusByProjectId
);
taskStatusRoutes.get(
  "/:id",
  authorize("readSingle-taskStatus"),
  getTaskStatusById
);
taskStatusRoutes.put("/:id", authorize("update-taskStatus"), updateTaskStatus);
taskStatusRoutes.delete(
  "/:id",
  authorize("delete-taskStatus"),
  deleteTaskStatus
);

module.exports = taskStatusRoutes;
