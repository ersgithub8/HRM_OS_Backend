const express = require("express");
const hirarchyRoutes = express.Router();

const {
    role
} = require("./hirarchy.controller");
const authorize = require("../../../utils/authorize"); 
hirarchyRoutes.get("/:id", authorize("readSingle-user"), role); 
module.exports = hirarchyRoutes;