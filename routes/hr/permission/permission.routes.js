const express = require("express");
const { getAllPermission } = require("./permission.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const permissionRoutes = express.Router();

permissionRoutes.get("/", authorize("readAll-permission"), getAllPermission);

module.exports = permissionRoutes;
