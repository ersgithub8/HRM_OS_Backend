const express = require("express");
const {
  createSingleAward,
  getAllAward,
  getSingleAward,
  updateSingleAward,
  deleteSingleAward,
} = require("./award.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const awardRoutes = express.Router();
awardRoutes.post("/", authorize("create-award"), createSingleAward);
awardRoutes.get("/", authorize("readAll-award"), getAllAward);
awardRoutes.get("/:id", authorize(""), getSingleAward);
awardRoutes.put("/:id", authorize("update-award"), updateSingleAward);

awardRoutes.patch("/:id", authorize("delete-award"), deleteSingleAward);

module.exports = awardRoutes;
