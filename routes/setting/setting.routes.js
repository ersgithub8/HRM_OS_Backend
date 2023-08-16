const express = require("express");
const { updateSetting, getSetting } = require("./setting.controllers");
const authorize = require("../../utils/authorize"); // authentication middleware

const settingRoutes = express.Router();

settingRoutes.put("/", authorize("update-setting"), updateSetting);
settingRoutes.get("/", authorize("readAll-setting"), getSetting);

module.exports = settingRoutes;
