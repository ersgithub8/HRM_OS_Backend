const express = require("express");
const priorityRoutes = express.Router();
const {
  createSinglePriority,
  getAllPriority,
  getSinglePriority,
  updateSinglePriority,
  deleteSinglePriority,
} = require("./priority.controller");
const authorize = require("../../../utils/authorize");

priorityRoutes.post("/", authorize("create-priority"), createSinglePriority);
priorityRoutes.get("/", authorize("readAll-priority"), getAllPriority);
priorityRoutes.get("/:id", authorize("readSingle-priority"), getSinglePriority);
priorityRoutes.put("/:id", authorize("update-priority"), updateSinglePriority);
priorityRoutes.delete(
  "/:id",
  authorize("delete-priority"),
  deleteSinglePriority
);

module.exports = priorityRoutes;
