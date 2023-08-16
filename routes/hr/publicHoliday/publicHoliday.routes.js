const express = require("express");

const {
  createPublicHoliday,
  getAllPublicHoliday,
  getSinglePublicHoliday,
  updateSinglePublicHoliday,
  deleteSinglePublicHoliday,
} = require("./publicHoliday.controller");
const authorize = require("../../../utils/authorize"); // authentication middleware

const publicHolidayRoutes = express.Router();

publicHolidayRoutes.post(
  "/",
  authorize("create-publicHoliday"),
  createPublicHoliday
);
publicHolidayRoutes.get(
  "/",
  authorize("readAll-publicHoliday"),
  getAllPublicHoliday
);
publicHolidayRoutes.get(
  "/:id",
  authorize("readSingle-publicHoliday"),
  getSinglePublicHoliday
);
publicHolidayRoutes.put(
  "/:id",
  authorize("update-publicHoliday"),
  updateSinglePublicHoliday
);
publicHolidayRoutes.delete(
  "/:id",
  authorize("delete-publicHoliday"),
  deleteSinglePublicHoliday
);

module.exports = publicHolidayRoutes;
