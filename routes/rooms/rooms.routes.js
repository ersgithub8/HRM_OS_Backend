const express = require("express");
const roomsRoutes = express.Router();
const {
    createrooms,
    getAllrooms,
  getroomById,
    updaterooms,
    deleteroom,
    getroomBylocationId
} = require("./rooms.controller");
const authorize = require("../../utils/authorize");

roomsRoutes.post("/", authorize("create-room"), createrooms);
roomsRoutes.get("/", authorize("readAll-room"), getAllrooms);
roomsRoutes.get("/:id", authorize("readSingle-room"), getroomById);
roomsRoutes.get("/location/:id", authorize("readSingle-room"), getroomBylocationId);
roomsRoutes.put("/update/:id", authorize("update-room"), updaterooms);
roomsRoutes.delete("/delete/:id", authorize("delete-room"), deleteroom);

module.exports = roomsRoutes;