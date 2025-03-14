const rateLimit = require("express-rate-limit");
const compression = require("compression");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const { join } = require('path');
const fs=require("fs")
const app = express();
app.use(express.static(path.join(__dirname, "./public")));
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.send("Server is Running");
});
let allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3000/",
  "http://localhost:3001",
  "http://localhost:5000",
  "http://localhost:3001/",
  "http://4.227.140.35:3000",
  "http://3.111.150.18:3000",
  "https://www.wise1ne.com",
  "https://www.wise1ne.com",
  "https://www.app.wise1ne.com/",
  "https://app.wise1ne.com/",
  "https://app.wise1ne.com"
];

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
// limit the number of requests from a single IP address
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Limit each IP to 20 requests per `window` (here, per 15 minutes)
  standardHeaders: false, // Disable rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = '';

    switch (file.fieldname) {
      case 'image':
        folder = 'images';
        break;
      case 'firstaid':
        folder = 'firstaid';
        break;
      case 'dbscheck':
        folder = 'dbscheck';
        break;
      case 'safeguard':
        folder = 'safeguard';
        break;
      case 'attachment':
        folder = 'attachment';
        break;
      case 'adminattachment':
        folder = 'adminattachment';
        break;
      case 'userAttachment':
        folder = 'userattachment';
        break;
      case 'contractAttachment':
        folder = 'contractAttachment';
        break;
      default:
        folder = 'uploads';
    }

    cb(null, `./uploads/${folder}`);
  },
  filename: function (req, file, cb) {
    const uniqueIdentifier = Date.now();
    const ext = path.extname(file.originalname);
    const fileName = `${uniqueIdentifier}${ext}`;
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.originalname.match(/\.(mp4|jpeg|jpg|png|pdf|gif|svg|txt|docs|csv|rtf|webp|zip)$/)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const uploadimagesimple = multer({
  storage: storage,
  fileFilter: fileFilter,
});
app.post("/upload", uploadimagesimple.fields([
  { name: 'image', maxCount: 1 },
  { name: 'firstaid', maxCount: 1 },
  { name: 'dbscheck', maxCount: 1 },
  { name: 'safeguard', maxCount: 1 },
  { name: 'attachment', maxCount: 1 },
  { name: 'adminattachment', maxCount: 1 },
  { name: 'userAttachment', maxCount: 1 },
  { name: 'contractAttachment', maxCount: 1 },
]), (req, res) => {
  console.log("Reached the multiple images route handler");

  if (req.files) {
    const files = {};

    // Iterate through each file type and set the path directly
    ['image', 'firstaid', 'dbscheck', 'safeguard', 'attachment', 'adminattachment', 'userAttachment', 'contractAttachment'].forEach((fileType) => {
      const file = req.files[fileType] && req.files[fileType][0];
      if (file) {
        const split = file.path.split("uploads");
        const path = split[1].replace(/\\/g, "/");
        const baseUrl = req.protocol + "://backend.wise1ne.com";
        files[fileType] = { path: baseUrl + "/uploads" + path };
      }
    });

    return res.status(200).json({
      files: files,
      message: "Files successfully uploaded",
      error: false,
    });
  } else {
    return res.status(400).json({ message: "Image upload failed" });
  }
});
app.delete('/delete/:fileType', async (req, res) => {
  const { fileType } = req.params;

  if (!['image', 'firstaid', 'dbscheck', 'safeguard', 'attachment', 'adminattachment', 'userAttachment', 'contractAttachment'].includes(fileType)) {
    return res.status(400).json({ message: 'Invalid file type', error: true });
  }

  try {
    const filePath = req.body.filePath; // Assuming you pass the file path in the request body

    // Ensure the file path is within the "uploads" directory
    // if (!filePath.startsWith('./uploads')) {
    //   return res.status(400).json({ message: 'Invalid file path', error: true });
    // }

    // Check if the file exists
    await fs.promises.access(filePath, fs.constants.F_OK);


    // Delete the file
    await fs.promises.unlink(filePath, fs.constants.F_OK);


    return res.status(200).json({ message: 'File deleted successfully', error: false });
  } catch (error) {
    console.error(error);
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'File not found', error: true });
    } else {
      return res.status(500).json({ message: 'Failed to delete the file', error: true });
    }
  }
});
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
app.use("/location", require("./routes/hr/location/location.routes"));
// app.use("/upload", require("./routes/hr/uploadimage/uploadimg.routes"));

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
app.use(
  "/hirarchy",
  require("./routes/hr/hirarchy/hirarchy.route")
);
app.use(
  "/training",
  require("./routes/hr/training/training.routes")
);
app.use(
  "/meeting",
  require("./routes/meeting/meeting.routes")
);
app.use(
  "/rooms",
  require("./routes/rooms/rooms.routes")
);
app.use("/shifts", require("./routes/shifts/shifts.routes"));
app.use("/request", require("./routes/request/request.routes"));


module.exports = app;
