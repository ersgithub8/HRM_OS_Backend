const express = require("express");
const {
  createSingleRole,
  getAllRole,
  getSingleRole,
  updateSingleRole,
  deleteSingleRole,
} = require("./role.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const roleRoutes = express.Router();

roleRoutes.post("/", authorize("create-role"), createSingleRole);
roleRoutes.get("/", authorize("readAll-role"), getAllRole);
roleRoutes.get("/:id", authorize("readSingle-role"), getSingleRole);
roleRoutes.put("/:id", authorize("update-role"), updateSingleRole);
roleRoutes.patch("/:id", authorize("delete-role"), deleteSingleRole);

module.exports = roleRoutes;
