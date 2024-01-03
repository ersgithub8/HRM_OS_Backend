const express = require("express");
const {

  addrequest,
  getSinglerequest,
  getAllrequest,
  getSingleuserrequest,
  swaprequest,
  deleteRequest
  
} = require("./request.contoller");
const authorize = require("../../utils/authorize"); 

const requestRoutes = express.Router();

requestRoutes.post("/", authorize("create-request"), addrequest);
requestRoutes.get("/allrequest", authorize("readAll-request"), getAllrequest);
requestRoutes.get("/:id", authorize("readSingle-request"), getSinglerequest);
requestRoutes.get("/users/:id", authorize("readSingle-request"), getSingleuserrequest);
requestRoutes.put("/swapreq/:id", authorize("update-request"), swaprequest);
requestRoutes.delete("/:id", authorize("delete-request"), deleteRequest);

module.exports = requestRoutes;