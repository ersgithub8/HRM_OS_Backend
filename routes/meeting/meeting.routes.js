const express = require("express");
const meetingRoutes = express.Router();
const {
    createmeeting,
    getAllMeeting,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  getMeetingByuserId,
} = require("./meeting.controller");
const authorize = require("../../utils/authorize");

meetingRoutes.post("/", authorize("create-meeting"), createmeeting);
meetingRoutes.get("/", authorize("readAll-meeting"), getAllMeeting);
meetingRoutes.get("/:id", authorize("readSingle-meeting"), getMeetingById);
meetingRoutes.get("/user/:id", authorize("readSingle-meeting"), getMeetingByuserId);
meetingRoutes.put("/update/:id", authorize("update-meeting"), updateMeeting);
meetingRoutes.delete("/:id", authorize("delete-meeting"), deleteMeeting);

module.exports = meetingRoutes;
