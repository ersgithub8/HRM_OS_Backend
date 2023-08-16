const rateLimit = require("express-rate-limit");
const compression = require("compression");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

/* variables */
// express app instance
const app = express();

// holds all the allowed origins for cors access
let allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://4.227.140.35:3001",
  "http://4.227.140.35:3000",
  "http://3.111.150.18:3000",
];

// limit the number of requests from a single IP address
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Limit each IP to 20 requests per `window` (here, per 15 minutes)
  standardHeaders: false, // Disable rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/* Middleware */
// for compressing the response body
app.use(compression());
// helmet: secure express app by setting various HTTP headers. And serve cross origin resources.
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
// morgan: log requests to console in dev environment
app.use(morgan("dev"));
// allows cors access from allowedOrigins array
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        let msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);

// parse requests of content-type - application/json
app.use(express.json({ extended: true }));

/* Routes */
app.use(
  "/role-permission",
  require("./routes/hr/rolePermission/rolePermission.routes")
);
app.use(
  "/transaction",
  require("./routes/accounting/transaction/transaction.routes")
);
app.use("/permission", require("./routes/hr/permission/permission.routes"));
app.use("/user", limiter, require("./routes/user/user.routes"));
app.use("/role", require("./routes/hr/role/role.routes"));
app.use("/designation", require("./routes/hr/designation/designation.routes"));
app.use("/account", require("./routes/accounting/account/account.routes"));
app.use("/setting", require("./routes/setting/setting.routes"));
app.use("/email", require("./routes/email/email.routes"));
app.use("/department", require("./routes/hr/department/department.routes"));
app.use(
  "/employment-status",
  require("./routes/hr/employmentStatus/employmentStatus.routes")
);
app.use(
  "/announcement",
  require("./routes/hr/announcement/announcement.routes")
);
app.use(
  "/leave-application",
  require("./routes/hr/leaveApplication/leaveApplication.routes")
);
app.use("/attendance", require("./routes/hr/attendance/attendance.routes"));
app.use("/payroll", require("./routes/hr/payroll/payroll.routes"));
app.use("/education", require("./routes/hr/education/education.routes"));
app.use(
  "/salaryHistory",
  require("./routes/hr/salaryHistory/salaryHistory.routes")
);
app.use(
  "/designationHistory",
  require("./routes/hr/designationHistory/designationHistory.routes")
);
app.use("/dashboard", require("./routes/dashboard/dashboard.routes"));
app.use("/shift", require("./routes/hr/shift/shift.routes"));
app.use("/files", require("./routes/files/files.routes"));
app.use("/leave-policy", require("./routes/hr/leavePolicy/leavePolicy.routes"));
app.use(
  "/weekly-holiday",
  require("./routes/hr/weeklyHoliday/weeklyHoliday.routes")
);
app.use(
  "/public-holiday",
  require("./routes/hr/publicHoliday/publicHoliday.routes")
);
app.use("/award", require("./routes/hr/award/award.routes"));
app.use(
  "/awardHistory",
  require("./routes/hr/awardHistory/awardHistory.routes")
);

//project management routes
app.use(
  "/project",
  require("./routes/projectManagement/project/project.routes")
);
app.use(
  "/milestone",
  require("./routes/projectManagement/milestone/milestone.routes")
);
app.use("/tasks", require("./routes/projectManagement/tasks/tasks.routes"));
app.use(
  "/assigned-task",
  require("./routes/projectManagement/assignedTask/assignedTask.routes")
);
app.use(
  "/project-team",
  require("./routes/projectManagement/projectTeam/projectTeam.routes")
);
app.use(
  "/task-status",
  require("./routes/projectManagement/taskStatus/taskStatus.routes")
);
app.use(
  "/task-priority",
  require("./routes/projectManagement/priority/priority.routes")
);
module.exports = app;
