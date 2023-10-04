const express = require("express");
const {
    createSingleTraining,
    getAllTrining,
    getSingleTrining,
    updateSingleTrining,
    deleteSingleTrining,
} = require("./training.controller");





module.exports = trainingRoutes;