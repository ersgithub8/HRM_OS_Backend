const express = require("express");
const roomsRoutes = express.Router();
const {
    createrooms,
    getAllrooms,
//   getMeetingById,
    updaterooms,
    deleteroom,
} = require("./rooms.controller");
const authorize = require("../../utils/authorize");

roomsRoutes.post("/", authorize("create-room"), createrooms);
roomsRoutes.get("/", authorize("readAll-room"), getAllrooms);
// meetingRoutes.get("/:id", authorize("readSingle-meeting"), getMeetingById);
roomsRoutes.put("/update/:id", authorize("update-room"), updaterooms);
roomsRoutes.delete("/delete/:id", authorize("delete-room"), deleteroom);

module.exports = roomsRoutes;