const express = require("express");
const {

  addrequest,
  getSinglerequest,
  getAllrequest,
  getSingleuserrequest,
  swaprequest
  
} = require("./request.contoller");
const authorize = require("../../utils/authorize"); 

const requestRoutes = express.Router();

requestRoutes.post("/", authorize(""), addrequest);
requestRoutes.get("/allrequest", authorize(""), getAllrequest);
requestRoutes.get("/:id", authorize(""), getSinglerequest);
requestRoutes.get("/users/:id", authorize(""), getSingleuserrequest);
requestRoutes.put("/swapreq/:id", authorize(""), swaprequest);


module.exports = requestRoutes;