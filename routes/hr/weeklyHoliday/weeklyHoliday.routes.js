const express = require("express");

const {
  createSingleWeeklyHoliday,
  getAllWeeklyHoliday,
  getSingleWeeklyHoliday,
  updateSingleWeeklyHoliday,
  deleteSingleWeeklyHoliday,
  getSingleWeeklyHolidayByuserId,
} = require("./weeklyHoliday.controller");
const authorize = require("../../../utils/authorize"); // authentication middleware

const weeklyHolidayRoutes = express.Router();

weeklyHolidayRoutes.post(
  "/",
  authorize("create-weeklyHoliday"),
  createSingleWeeklyHoliday
);
weeklyHolidayRoutes.get(
  "/",
  authorize("readAll-weeklyHoliday"),
  getAllWeeklyHoliday
);
weeklyHolidayRoutes.get(
  "/:id",
  authorize("readSingle-weeklyHoliday"),
  getSingleWeeklyHoliday
);
weeklyHolidayRoutes.get(
  "/:id",
  authorize("readSingle-weeklyHoliday"),
  getSingleWeeklyHolidayByuserId
);
weeklyHolidayRoutes.put(
  "/:id",
  authorize("update-weeklyHoliday"),
  updateSingleWeeklyHoliday
);
weeklyHolidayRoutes.delete(
  "/:id",
  authorize("delete-weeklyHoliday"),
  deleteSingleWeeklyHoliday
);

module.exports = weeklyHolidayRoutes;
