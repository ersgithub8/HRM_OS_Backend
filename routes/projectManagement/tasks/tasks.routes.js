const express = require("express");
const tasksRoutes = express.Router();
const {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require("./tasks.controller");
const authorize = require("../../../utils/authorize");

tasksRoutes.post("/", authorize("create-task"), createTask);
tasksRoutes.get("/", authorize("readAll-task"), getAllTasks);
tasksRoutes.get("/:id", authorize("readSingle-task"), getTaskById);
tasksRoutes.put("/:id", authorize("update-task"), updateTask);
tasksRoutes.delete("/:id", authorize("delete-task"), deleteTask);

module.exports = tasksRoutes;
