const express = require("express");
const {
  createSingleAccount,
  getAllAccount,
  getSingleAccount,
  updateSingleAccount,
  deleteSingleAccount,
} = require("./account.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const accountRoutes = express.Router();

accountRoutes.post("/", authorize("create-transaction"), createSingleAccount);
accountRoutes.get("/", authorize("readAll-transaction"), getAllAccount);
accountRoutes.get(
  "/:id",
  authorize("readSingle-transaction"),
  getSingleAccount
);
accountRoutes.put("/:id", authorize("update-transaction"), updateSingleAccount);
accountRoutes.patch(
  "/:id",
  authorize("delete-transaction"),
  deleteSingleAccount
);

module.exports = accountRoutes;
