const express = require("express");
const {
  createRolePermission,
  getAllRolePermission,
  getSingleRolePermission,
  updateRolePermission,
  deleteSingleRolePermission,
} = require("./rolePermission.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const rolePermissionRoutes = express.Router();

rolePermissionRoutes.post(
  "/",
  authorize("create-rolePermission"),
  createRolePermission
);
rolePermissionRoutes.get(
  "/",
  authorize("readAll-rolePermission"),
  getAllRolePermission
);
rolePermissionRoutes.get(
  "/:id",
  authorize("readSingle-rolePermission"),
  getSingleRolePermission
);
rolePermissionRoutes.put(
  "/:id",
  authorize("update-rolePermission"),
  updateRolePermission
);
rolePermissionRoutes.delete(
  "/:id",
  authorize("delete-rolePermission"),
  deleteSingleRolePermission
);

module.exports = rolePermissionRoutes;
