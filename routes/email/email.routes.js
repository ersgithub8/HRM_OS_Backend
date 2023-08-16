const express = require("express");
const { sendEmail } = require("./email.controllers");
const authorize = require("../../utils/authorize"); // authentication middleware

const emailRoutes = express.Router();

emailRoutes.get("/", authorize("create-email"), sendEmail);
module.exports = emailRoutes;
