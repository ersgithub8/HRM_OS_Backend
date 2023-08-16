const express = require("express");
const { getDashboardData } = require("./dashboard.controllers");
const authorize = require("../../utils/authorize"); // authentication middleware

const dashboardRoutes = express.Router();

dashboardRoutes.get("/", authorize("readAll-dashboard"), getDashboardData);

module.exports = dashboardRoutes;
