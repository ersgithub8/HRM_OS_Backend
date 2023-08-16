const express = require("express");

const {
  calculatePayroll,
  generatePayslip,
  getAllPayslip,
  getSinglePayslip,
  updatePayslip,
  makePayment,
} = require("./payroll.controller");
const authorize = require("../../../utils/authorize"); // authentication middleware

const payrollRoutes = express.Router();

payrollRoutes.get("/", authorize("readAll-payroll"), calculatePayroll);
payrollRoutes.post("/", authorize("create-payroll"), generatePayslip);
payrollRoutes.get("/all", authorize("readAll-payroll"), getAllPayslip);
payrollRoutes.get("/:id", authorize("readSingle-payroll"), getSinglePayslip);
payrollRoutes.put("/:id", authorize("update-payroll"), updatePayslip);
payrollRoutes.put("/payment/:id", authorize("update-payroll"), makePayment);
module.exports = payrollRoutes;
