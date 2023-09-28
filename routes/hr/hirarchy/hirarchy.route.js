const express = require("express");
const hirarchyRoutes = express.Router();

const {
    role,
    rolenew
} = require("./hirarchy.controller");
const authorize = require("../../../utils/authorize"); 
hirarchyRoutes.get("/:id", authorize("readSingle-user"), role);
hirarchyRoutes.get("/rolenew/:id", authorize("readSingle-user"), rolenew); 
module.exports = hirarchyRoutes;