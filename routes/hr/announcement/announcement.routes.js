const express = require("express");

const {
  createSingleAnnouncement,
  getAllAnnouncement,
  getSingleAnnouncement,
  updateSingleAnnouncement,
  deletedAnnouncement,
} = require("./announcement.controller");
const authorize = require("../../../utils/authorize"); // authentication middleware

const announcementRoutes = express.Router();

announcementRoutes.post(
  "/",
  authorize("create-announcement"),
  createSingleAnnouncement
);
announcementRoutes.get(
  "/",
  authorize("readAll-announcement"),
  getAllAnnouncement
);
announcementRoutes.get(
  "/:id",
  authorize("readSingle-announcement"),
  getSingleAnnouncement
);
announcementRoutes.put(
  "/:id",
  authorize("update-announcement"),
  updateSingleAnnouncement
);
announcementRoutes.patch(
  "/:id",
  authorize("delete-announcement"),
  deletedAnnouncement
);

module.exports = announcementRoutes;
