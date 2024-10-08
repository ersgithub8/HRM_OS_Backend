const { getPagination } = require("../../../utils/query");
const moment = require("moment");
const prisma = require("../../../utils/prisma");
const Sequelize = require("sequelize"); // Assuming you're using Sequelize for PostgreSQL
const Op = Sequelize.Op;
const operatorsAliases = {
  $between: Op.between, //create an alias for Op.between
}
const admin = require("firebase-admin");
var FCM = require("fcm-node");

const createAttendance = async (req, res) => {
  try {
    const id = parseInt(req.body.userId);
    let inTimeStatus;
    let outTimeStatus;
    let scheduleForToday;

    // Check user authorization
    if (!(id === req.auth.sub) && !req.auth.permissions.includes("create-attendance")) {
      return res.status(401).json({
        message: "Unauthorized. You are not authorized to give attendance",
      });
    }

    const today = moment().startOf('day');
    const tomorrow = moment(today).add(1, 'days');

    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
      include: {
        shifts: {
          include: {
            schedule: true,
          },
        },
      },
    });

    if (!user || !user.shifts || user.shifts.length === 0) {
      return res.status(400).json({
        message: "Today's shift not found",
      });
    }
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: id,
        inTime: {
          gte: today.toDate(),
          lt: tomorrow.toDate(),
        },
      },
    });
    // Iterate through all shifts and schedules to find the schedule for today
    for (const shift of user.shifts) {
      scheduleForToday = shift.schedule.find((schedule) => {
        const scheduleDate = new Date(schedule.shiftDate);
        const todayDate = new Date(today);
        return (
          scheduleDate.setHours(0, 0, 0, 0) === todayDate.setHours(0, 0, 0, 0) && schedule.status
        );
      });

      if (scheduleForToday) {
        break; // Break the loop if a schedule for today is found
      }
    }

    if (!scheduleForToday) {
      return res.status(400).json({ message: "Today's shift is not found" });
    }

    else if (scheduleForToday) {
      const currentTimeInUserTimezone = moment().tz(user.timezone || "UTC").toDate();
      const startTimeInUserTimezone = moment(scheduleForToday.startTime).tz(user.timezone || "UTC").toDate();
      const endTimeInUserTimezone = moment(scheduleForToday.endTime).tz(user.timezone || "UTC").toDate();
    
      if (currentTimeInUserTimezone <= startTimeInUserTimezone) {
        inTimeStatus = "OnTime";
      } else if (currentTimeInUserTimezone >= endTimeInUserTimezone) {
        outTimeStatus = "OnTime";
      } else if (currentTimeInUserTimezone > startTimeInUserTimezone) {
        inTimeStatus = "Late";
        // outTimeStatus = "Early";
      } else if (currentTimeInUserTimezone > endTimeInUserTimezone) {
        inTimeStatus = "OnTime";
      }
            if (currentTimeInUserTimezone < endTimeInUserTimezone) {
              outTimeStatus = "Early";
            } else if (currentTimeInUserTimezone === endTimeInUserTimezone) {
              outTimeStatus = "OnTime";
            } 
    }
    //  return
    const existingCheckOut = await prisma.attendance.findFirst({
      where: {
        userId: id,
        outTime: {
          gte: today.toDate(),
          lt: tomorrow.toDate(),
        },
      },
    });
    if (attendance && existingCheckOut) {
      return res.status(400).json({
        message: "Today's attendance has already been marked.",
      });
    }

    if (req.query.query === "manualPunch") {
      const inTime = new Date();
      const outTime = new Date();

      const totalHours = Math.abs(outTime - inTime) / 36e5;

      const newAttendance = await prisma.attendance.create({
        data: {
          userId: id,
          inTime: inTime,
          outTime: outTime,
          punchBy: req.auth.sub,
          inTimeStatus: inTimeStatus,
          outTimeStatus: outTimeStatus,
          comment: req.body.comment ? req.body.comment : null,
          date: req.body.date ? req.body.date : new Date(),
          attendenceStatus: req.body.attendenceStatus ? req.body.attendenceStatus : "present",
          ip: req.body.ip ? req.body.ip : null,
          totalHour: parseFloat(totalHours.toFixed(3)),
        },
      });

      return res.status(200).json({
        newAttendance,
        message: "Clock in marked successfully.",
      });
    }
    else if (attendance === null) {
      
      const inTime = new Date();
      const newAttendance = await prisma.attendance.create({
        data: {
          userId: id,
          inTime: inTime,
          outTime: null,
          punchBy: req.auth.sub,
          comment: req.body.comment ? req.body.comment : null,
          date: req.body.date ? req.body.date : new Date(),
          attendenceStatus: req.body.attendenceStatus ? req.body.attendenceStatus : "present",
          inTimeStatus: inTimeStatus,
          outTimeStatus: null,
        },
      });

      return res.status(200).json({
        newAttendance,
        message: "Clock in marked successfully.",
      });
    } else {
      const inTime = new Date(attendance.inTime);
      const outTime = new Date();

    const timeDiff = moment(outTime).diff(moment(inTime));
const totalMinutes = timeDiff / (1000 * 60);
const hours = Math.floor(totalMinutes / 60);
const minutes = totalMinutes % 60;
const totalHour = parseFloat(`${hours}.${(minutes < 10 ? '0' : '')}${minutes.toFixed(2)}`);
const overtimeHours = Math.max(0, totalHour - scheduleForToday.workHour);
// const overtimeMinutes = Math.round((overtimeHours % 1) * 60);
const overtimeWithBuffer = overtimeHours >= 0.30 ? overtimeHours : 0;
console.log(overtimeWithBuffer,"over");
const overtime = parseFloat(overtimeWithBuffer.toFixed(2));

// Check if overtime is greater than 30 minutes
      const newAttendance = await prisma.attendance.update({
        where: {
          id: attendance.id,
        },
        data: {
          outTime: outTime,
          overtime: overtime,
          totalHour: totalHour,
          outTimeStatus: outTimeStatus,
        },
      });

      return res.status(200).json({
        newAttendance,
        message: "Clock out marked successfully.",
      });
    }

  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
//original
const createadminAttendance = async (req, res) => {
  try {
    const employeeId = req.body.employeeId;
    const date = req.body.date ? new Date(req.body.date) : new Date();
    const attendenceStatus = req.body.attendenceStatus ? req.body.attendenceStatus : "present";

    // Fetch the user by employeeId
    const user = await prisma.user.findUnique({
      where: {
        employeeId: employeeId,
      },
      include: {
        shifts: {
          include: {
            schedule: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "EmployeeID doesn't exists." });
    }

    const today = moment(date).startOf('day');
    const tomorrow = moment(today).add(1, 'days');
  if (!user || !user.shifts || user.shifts.length === 0) {
      return res.status(400).json({
        message: "Today your shifts not found",
      });
    }

    if (!user || !user.shifts || user.shifts.length === 0) {
      return res.status(400).json({
        message: "Today's shift not found",
      });
    }
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: today.toDate(),
          lt: tomorrow.toDate(),
        },
      },
    });

    // Iterate through all shifts and schedules to find the schedule for today
    for (const shift of user.shifts) {
      scheduleForToday = shift.schedule.find((schedule) => {
        const scheduleDate = new Date(schedule.shiftDate);
        const todayDate = new Date(today);
        return (
          scheduleDate.setHours(0, 0, 0, 0) === todayDate.setHours(0, 0, 0, 0) && schedule.status
        );
      });

      if (scheduleForToday) {
        break; // Break the loop if a schedule for today is found
      }
    }

    if (!scheduleForToday) {
      return res.status(400).json({ message: "Today's shift is not found" });
    }

    if (attendance) {
      return res.status(400).json({ message: "Today's attendance has already been marked." });
    }

    if (req.query.query === "manualPunch") {
      const { date, attendenceStatus, checkinTime, checkoutTime } = req.body;

      const inTime = new Date(checkinTime);
      const outTime = new Date(checkoutTime);
      const totalHours = (outTime - inTime) / (1000 * 60 * 60);
      const newAttendance = await prisma.attendance.create({
        data: {
          userId: user.id,
          inTime: checkinTime,
          outTime: checkoutTime,
          punchBy: req.auth.sub,
          inTimeStatus: null,
          outTimeStatus: null,
          comment: null,
          date: date,
          attendenceStatus: attendenceStatus,
          ip: null,
          totalHour: totalHours.toFixed(2),
          createdAt: date,
        },
      });

      // Fetch all today's attendance records including the newly created one
      const allAttendance = await prisma.attendance.findMany({
        where: {
          date: {
            gte: today.toDate(),
            lt: tomorrow.toDate(),
          },
        },
        orderBy: [
          {
            id: "desc",
          },
        ],
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              employeeId: true,

            },
          },
        },
      });

      const punchBy = await prisma.user.findMany({
        where: {
          id: { in: allAttendance.map((item) => item.punchBy) },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
        },
      });

      const result = allAttendance.map((attendance) => {
        return {
          ...attendance,
          punchBy: punchBy,
        };
      });

      return res.status(200).json({
        // result,
        message: "Attendance marked successfully."
      });
    } else if (!attendance) {
      const { date, attendenceStatus, checkinTime, checkoutTime } = req.body;

      const inTime = new Date(checkinTime);
      const outTime = new Date(checkoutTime);
      const totalHours = (outTime - inTime) / (1000 * 60 * 60);
      const formattedTotalHours = parseFloat(totalHours.toFixed(2)); // Convert the string to a float

      const newAttendance = await prisma.attendance.create({
        data: {
          userId: user.id,
          inTime: inTime,
          outTime: outTime,
          punchBy: req.auth.sub,
          inTimeStatus: null,
          outTimeStatus: null,
          comment: null,
          date: date,
          attendenceStatus: attendenceStatus,
          ip: null,
          totalHour: formattedTotalHours,
          createdAt: date,

        },
      });

      // Fetch all today's attendance records including the newly created one
      const allAttendance = await prisma.attendance.findMany({
        where: {
          date: {
            gte: today.toDate(),
            lt: tomorrow.toDate(),
          },
        },
        orderBy: [
          {
            id: "desc",
          },
        ],
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              employeeId: true,
            },
          },
        },
      });

      const punchBy = await prisma.user.findMany({
        where: {
          id: { in: allAttendance.map((item) => item.punchBy) },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
        },
      });

      const result = allAttendance.map((attendance) => {
        return {
          ...attendance,
          punchBy: punchBy,
        };
      });

      if (attendenceStatus && user.status === true) {
        const Title = 'Attendance Marked';
        const Body = user.firstName + " " + user.lastName + "  " + 'Your attendance has been ' + attendenceStatus;
        const Desc = 'Attendance marked notification';
        const Token = user.firebaseToken;
        // const Device = user.device;
        console.log(Title, Body, Desc, Token);
        sendnotifiy(Title, Body, Desc, Token);
      }

      return res.status(200).json({
        // result,
        message: "Attendence marked successfully."
      });
    } else {
      const newAttendance = await prisma.attendance.update({
        where: {
          id: attendance.id,
        },
        data: {
          outTime: null,
          inTime: null,
          totalHour: null,
          outTimeStatus: null,
          attendenceStatus: req.body.attendenceStatus,
          date: req.body.date,
        },
      });

      // Fetch all today's attendance records including the updated one
      const allAttendance = await prisma.attendance.findMany({
        where: {
          date: {
            gte: today.toDate(),
            lt: tomorrow.toDate(),
          },
        },
        orderBy: [
          {
            id: "desc",
          },
        ],
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              employeeId: true,
            },
          },
        },
      });

      const punchBy = await prisma.user.findMany({
        where: {
          id: { in: allAttendance.map((item) => item.punchBy) },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
        },
      });

      const result = allAttendance.map((attendance) => {
        return {
          ...attendance,
          punchBy: punchBy,
        };
      });

      if (attendenceStatus && user.status === true) {
        const Title = 'Attendance Marked';
        const Body = user.firstName + " " + user.lastName + "  " + 'Your attendance has been ' + attendenceStatus;
        const Desc = 'Attendance marked notification';
        const Token = user.firebaseToken;
        // const Device = user.device;
        console.log(Title, Body, Desc, Token);
        sendnotifiy(Title, Body, Desc, Token);
      }

      return res.status(200).json({
        // result,
        message: "Attendence marked successfully."
      });
    }
    return res.status(200).json({
      message: "Attendence marked successfully.",
    });

  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//get all attendence
const getAllAttendance = async (req, res) => {
  if (!req.auth.permissions.includes("readAll-attendance")) {
    return res
      .status(401)
      .json({ message: "you are not able to access this routes" });
  }
  if (req.query.query === "all") {
    const allAttendance = await prisma.attendance.findMany({
      orderBy: [
        {
          id: "desc",
        },
      ],
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,

          },
        },
      },
    });

    const punchBy = await prisma.user.findMany({
      where: {
        id: { in: allAttendance.map((item) => item.punchBy) },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,

      },
    });

    const result = allAttendance.map((attendance) => {
      return {
        ...attendance,
        punchBy: punchBy,
      };
    });

    return res.status(200).json(result);
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allAttendance = await prisma.attendance.findMany({
        orderBy: [
          {
            id: "desc",
          },
        ],
        skip: Number(skip),
        take: Number(limit),
        where: {
          inTime: {
            gte: new Date(req.query.startdate),
            lte: new Date(req.query.enddate),
          },
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              employeeId: true,

            },
          },
        },
      });
      const punchBy = await prisma.user.findMany({
        where: {
          id: { in: allAttendance.map((item) => item.punchBy) },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
        },
      });
      const result = allAttendance.map((attendance) => {
        return {
          ...attendance,
          punchBy: punchBy,
        };
      });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

//get single attendence by attendenceid
const getSingleAttendance = async (req, res) => {
  try {
    const singleAttendance = await prisma.attendance.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const punchBy = await prisma.user.findUnique({
      where: {
        id: singleAttendance.id,
      },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    if (
      (req.auth.sub !== singleAttendance.userId &&
        !req.auth.permissions.includes("readAll-attendance")) ||
      !req.auth.permissions.includes("readSingle-attendance")
    ) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = {
      ...singleAttendance,
      punchBy: punchBy,
    };

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
//get attence by userid
const getAttendanceByUserId = async (req, res) => {
  try {
    const { createdAtFrom, createdAtTo } = req.query;
    const userId = parseInt(req.params.id);

    // Define the base attendance query
    let attendanceQuery = {
      where: {
        userId: userId,
      },
      orderBy: [
        {
          id: "desc",
        },
      ],
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            designationHistory: { // Assuming the designation information is in a related model
              select: {
                designation: true,
                // Add other fields from designationHistory if needed
              },
            },
          },
        },
      },
    };

    // Check if createdAtFrom and createdAtTo query parameters are provided
    if (createdAtFrom && createdAtTo) {
      const startDate = new Date(createdAtFrom);
      const endDate = new Date(createdAtTo);
      endDate.setHours(23, 59, 59);


      // Validate startDate and endDate
      if (!isNaN(startDate) && !isNaN(endDate)) {
        attendanceQuery.where.createdAt = {
          gte: startDate,
          lte: endDate,
        };
      } else {
        return res.status(400).json({ message: "Invalid createdAtFrom or createdAtTo parameter." });
      }
    }
    else {
      const today = new Date();
      const todayStartDate = new Date(today);
      todayStartDate.setHours(0, 0, 0, 0);
      const todayEndDate = new Date(today);
      todayEndDate.setHours(23, 59, 59, 999);

      attendanceQuery.where.createdAt = {
        gte: todayStartDate,
        lte: todayEndDate,
      };
    }

    const allAttendance = await prisma.attendance.findMany(attendanceQuery);

    // const punchBy = await prisma.user.findMany({
    //   where: {
    //     id: { in: allAttendance.map((item) => item.punchBy) },
    //   },
    //   select: {
    //     id: true,
    //     firstName: true,
    //     lastName: true,
    //   },
    // });
    const punchByIds = allAttendance
      .map((item) => item.punchBy) // Get an array of punchBy values
      .filter((id) => id !== null && id !== undefined);
    let punchBy;

    if (punchByIds.length > 0) {
      // If there are non-null and non-undefined punchByIds, fetch corresponding users
      punchBy = await prisma.user.findMany({
        where: {
          id: { in: punchByIds },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
        },
      });
    } else {
      // If all punchByIds are null or undefined, set punchBy to an empty array
      punchBy = [];
    }

    // Construct the result object
    const result = {
      attendanceData: allAttendance.map((attendance) => {
        const response = {
          ...attendance,
          punchBy: punchBy,
          totalHours: null,
          totalMinutes: null,
        };

        if (attendance.attendenceStatus === "present" && attendance.inTime && attendance.outTime) {
          const checkInTime = new Date(attendance.inTime);
          const checkOutTime = new Date(attendance.outTime);
          const timeDiff = checkOutTime - checkInTime;
          response.totalHours = Math.floor(timeDiff / (1000 * 60 * 60)).toString().padStart(2, '0');
          response.totalMinutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        }

        return response;
      }),
      totaldays: {
        totalPresent: allAttendance.filter((attendance) => attendance.attendenceStatus === "present").length,
        totalLeave: allAttendance.filter((attendance) => attendance.attendenceStatus === "leave").length,
        totalAbsent: allAttendance.filter((attendance) => attendance.attendenceStatus === "absent").length,
      },
    };

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
// get the last attendance of a user
const getLastAttendanceByUserId = async (req, res) => {
  try {
    const lastAttendance = await prisma.attendance.findFirst({
      where: {
        userId: parseInt(req.params.id),
      },
      orderBy: [
        {
          id: "desc",
        },
      ],
    });
    return res.status(200).json(lastAttendance);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
function setDateTimeFromString(dateString) {
  const today = new Date();
  const databaseRecordDate = new Date(dateString);

  today.setHours(
    databaseRecordDate.getUTCHours(),
    databaseRecordDate.getUTCMinutes(),
    databaseRecordDate.getUTCSeconds(),
    databaseRecordDate.getUTCMilliseconds()
  );

  return today;
}
const getTodayAttendanceByUserId = async (req, res) => {
  try {
    // const today = new Date();
    // console.log(today, "fdhsj");
    // // return
    // today.setHours(0, 0, 0, 0);
    const databaseRecordDateString = "2023-10-25T05:48:06.155Z";
    const matchedDate = setDateTimeFromString(databaseRecordDateString);
    const today = matchedDate;
    // console.log(today); 
    // const databaseRecordDate = new Date("2023-10-20T05:48:06.155Z");
    // today.setHours(databaseRecordDate.getHours(), databaseRecordDate.getMinutes(), databaseRecordDate.getSeconds(), databaseRecordDate.getMilliseconds());
    const userId = parseInt(req.params.id);

    const userLeavePolicy = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        leavePolicy: true, // Assuming you have a 'leavePolicy' field in the User model
      },
    });
    const userweeklyHolidays = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        weeklyHoliday: true, // Assuming you have a 'leavePolicy' field in the User model
      },
    });

    const todayAttendance = await prisma.attendance.findFirst({
      where: {
        userId: userId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      orderBy: [
        {
          id: 'desc',
        },
      ],
    });
    let isadmin = null;

    if (todayAttendance) {
      isadmin = todayAttendance.punchBy === todayAttendance.userId ? 'user' : 'admin';
    }
    const response = {
      inTime: null,
      isadmin: isadmin,
      outTime: null,
      totalHours: null,
      totalMinutes: null,
      totalSeconds: null,
      attendenceStatus: null,
      leavePolicy: userLeavePolicy ? userLeavePolicy.leavePolicy : null,
      weeklyHolidays: userweeklyHolidays ? userweeklyHolidays.weeklyHoliday : [], // Include weekly holidays in the response
    };

    if (!todayAttendance) {

      response.attendenceStatus = null;
      response.isadmin = null;
      return res.status(200).json(response);
    }
    const todayDayOfWeek = today.getDay();

    if (todayAttendance.inTime) {
      response.inTime = todayAttendance.inTime;

      if (todayAttendance.outTime) {
        const checkInTime = new Date(todayAttendance.inTime);
        const checkOutTime = new Date(todayAttendance.outTime);

        const timeDiff = checkOutTime - checkInTime;
        const totalHours = Math.floor(timeDiff / (1000 * 60 * 60));
        const totalMinutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const totalSeconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        response.outTime = todayAttendance.outTime;
        response.totalHours = totalHours.toString().padStart(2, '0');
        response.totalMinutes = totalMinutes.toString().padStart(2, '0');
        response.totalSeconds = totalSeconds.toString().padStart(2, '0');
        response.attendenceStatus = todayAttendance.attendenceStatus;
      } else {
        response.attendenceStatus = todayAttendance.attendenceStatus;
      }

      return res.status(200).json(response);
    }

    response.attendenceStatus = todayAttendance.attendenceStatus;
    return res.status(200).json(response);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
const search = async (req, res) => {
  if (!req.auth.permissions.includes("readAll-attendance")) {
    return res.status(401).json({ message: "You are not able to access this route." });
  }

 const { query, employeeId, createdAtFrom, createdAtTo,id } = req.query;
  const { skip, limit } = getPagination(req.query);

  try {
    let attendanceQuery = {
      orderBy: [
        {
          id: "desc",
        },
      ],
      skip: Number(skip),
      take: Number(limit),
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
      },
    };

    if (query === "all") {
      const todayStartDate = new Date();
      todayStartDate.setHours(0, 0, 0, 0); // Set time to midnight
      const todayEndDate = new Date();
      todayEndDate.setHours(23, 59, 59, 999); // Set time to end of the day
      const currentMonthStart = new Date(todayStartDate.getFullYear(), todayStartDate.getMonth(), 1);
      const previousMonthStart = new Date(todayStartDate.getFullYear(), todayStartDate.getMonth() - 1, 1);
      const previousMonthEnd = new Date(todayStartDate.getFullYear(), todayStartDate.getMonth(), 0);

      attendanceQuery.where = {
        createdAt: {
          gte: todayStartDate,
          lte: todayEndDate,
        },
      };

      const allAttendance = await prisma.attendance.findMany({
        ...attendanceQuery,
      });
      const punchByIds = allAttendance
        .map((item) => item.punchBy) // Get an array of punchBy values
        .filter((id) => id !== null && id !== undefined);
      let punchBy;

      if (punchByIds.length > 0) {
        // If there are non-null and non-undefined punchByIds, fetch corresponding users
        punchBy = await prisma.user.findMany({
          where: {
            id: { in: punchByIds },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        });
      } else {
        // If all punchByIds are null or undefined, set punchBy to an empty array
        punchBy = [];
      }

      // Count present and absent records
      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;
      let holidayCount = 0
      const totalUsers = await prisma.user.count({
        where: {
          status: true,
        },
      });


      allAttendance.forEach((attendance) => {
        if (attendance.attendenceStatus === "present") {
          presentCount++;
        } else if (attendance.attendenceStatus === "absent") {
          absentCount++;
        }
        else if (attendance.attendenceStatus === "leave") {
          leaveCount++;
        }
        else if (attendance.attendenceStatus === "holiday") {
          holidayCount++;
        }

      });
      const todays = new Date();

      const currentYears = todays.getFullYear();
      const currentMonths = todays.getMonth();
      const thisMonthStarts = new Date(currentYears, currentMonths, 1);
      const thisMonthEnds = new Date(currentYears, currentMonths + 1, 0, 23, 59, 59);

      const currentMonthCount = await prisma.user.count({
        where: {
          createdAt: {
            gte: thisMonthStarts,
            lte: thisMonthEnds,
          },
          status: true,
        },
      });
      const previousMonthCount = await prisma.user.count({
        where: {
          createdAt: {
            gte: previousMonthStart,
            lte: previousMonthEnd,
          },
          status: true,
        },
      });
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      // Calculate the start and end dates for this month
      const thisMonthStart = new Date(currentYear, currentMonth, 1);
      const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

      // Calculate the start and end dates for last month
      const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

      // Count users for this month and last month
      const thisMonthUserCount = await prisma.user.count({
        where: {
          createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
        },
      });
      console.log(thisMonthUserCount, "newmonth");
      const lastMonthUserCount = await prisma.user.count({
        where: {
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      });
      console.log(lastMonthUserCount, "oldmonth");


      // Calculate the percentage change
      let percentageChange = 0;
      if (lastMonthUserCount !== 0) {
        percentageChange = ((thisMonthUserCount - lastMonthUserCount) / lastMonthUserCount) * 100;
        percentageChange = Math.abs(percentageChange);
      } else if (thisMonthUserCount !== 0) {
        percentageChange = 100;
      }

      // Count users with different statuses
      const pendingUserCount = await prisma.user.count({
        where: {
          applicationStatus: 'PENDING',
        },
      });

      const approvedUserCount = await prisma.user.count({
        where: {
          applicationStatus: 'APPROVED',
        },
      });

      const rejectedUserCount = await prisma.user.count({
        where: {
          applicationStatus: 'REJECTED',
        },
      });
      const result = {
        totalPresent: presentCount,
        totalAbsent: absentCount,
        totalLeaves: leaveCount,
        totalHoliday: holidayCount,
        currentMonthUserCount: currentMonthCount,
        previousMonthUserCount: previousMonthCount,
        totalUsers: totalUsers,
        thisMonthUserCount: thisMonthUserCount,
        lastMonthUserCount: lastMonthUserCount,
        percentageChange: percentageChange,
        pendingUserCount: pendingUserCount,
        approvedUserCount: approvedUserCount,
        rejectedUserCount: rejectedUserCount,
        attendanceData: allAttendance.map((attendance) => {
          return {
            ...attendance,
            punchBy: punchBy,
          };
        })
      };
      return res.status(200).json(result);
    } 
     else if (id&&createdAtFrom && createdAtTo) {
      try {
        // Find users with matching first name and last name
        const startDate = new Date(createdAtFrom);
        const endDate = new Date(createdAtTo);
        endDate.setHours(23, 59, 59);
  console.log(startDate);
  console.log(endDate,"en");
        // if (isNaN(startDate) || isNaN(endDate)) {
        //   return res.status(400).json({ message: "Invalid date parameters." });
        // }
        const users = await prisma.user.findUnique({
          where: {
            id:parseInt(id)
          },
        });
    
        if (!users || users.length === 0) {
          return res.status(404).json({ message: "No users found with the provided first name and last name." });
        }
    
        // const userIds = users.map(user => user.id);
       
        // Find attendance records for the matched users within the specified date range
        const userAttendance = await prisma.attendance.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            userId: users.id,
          },
          ...attendanceQuery,
        });
    
        // Calculate total present, absent, leave, and holiday records
        let presentCount = 0;
        let absentCount = 0;
        let leaveCount = 0;
        let holidayCount = 0;
    
        userAttendance.forEach((attendance) => {
          if (attendance.attendenceStatus === "present") {
            presentCount++;
          } else if (attendance.attendenceStatus === "absent") {
            absentCount++;
          } else if (attendance.attendenceStatus === "leave") {
            leaveCount++;
          } else if (attendance.attendenceStatus === "holiday") {
            holidayCount++;
          }
        });
    
        // Find punchBy users for the attendance records
        const punchByIds = userAttendance
          .map((item) => item.punchBy)
          .filter((id) => id !== null && id !== undefined);
    
        let punchBy;
    
        if (punchByIds.length > 0) {
          punchBy = await prisma.user.findMany({
            where: {
              id: { in: punchByIds },
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
            },
          });
        } else {
          punchBy = [];
        }
    
        const result = {
          totalPresent: presentCount,
          totalAbsent: absentCount,
          totalLeaves: leaveCount,
          totalHoliday: holidayCount,
          totalUsers: users.length,
          attendanceData: userAttendance.map((attendance) => {
            return {
              ...attendance,
              punchBy: punchBy,
            };
          }),
        };
    
        return res.status(200).json(result);
      } catch (error) {
        return res.status(500).json({ message: "An error occurred while fetching attendance records.", error: error.message });
      }
    }
   else if (id) {
    
      const user = await prisma.user.findUnique({
        where: {
          id: parseInt(id),
        },
      });

      if (!user) {
        return res.status(400).json({ message: "User not found with the provided name." });
      }

      attendanceQuery.where = {
        // createdAt: {
        //   gte: startDate,
        //   lte: endDate,
        // },
        userId: user.id,
      };

      const userAttendance = await prisma.attendance.findMany({
        ...attendanceQuery,
      });

      // Calculate total present leaves and absent records
      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;
      let holidayCount = 0
      const totalUsers = await prisma.user.count({
        where: {
          status: true,
        },
      });


      userAttendance.forEach((attendance) => {
        if (attendance.attendenceStatus === "present") {
          presentCount++;
        } else if (attendance.attendenceStatus === "absent") {
          absentCount++;
        }
        else if (attendance.attendenceStatus === "leave") {
          leaveCount++;
        }
        else if (attendance.attendenceStatus === "holiday") {
          holidayCount++;
        }
      });
      const punchByIds = userAttendance
        .map((item) => item.punchBy) // Get an array of punchBy values
        .filter((id) => id !== null && id !== undefined);
      let punchBy;

      if (punchByIds.length > 0) {
        // If there are non-null and non-undefined punchByIds, fetch corresponding users
        punchBy = await prisma.user.findMany({
          where: {
            id: { in: punchByIds },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        });
      } else {
        // If all punchByIds are null or undefined, set punchBy to an empty array
        punchBy = [];
      }
      const result = {
        totalPresent: presentCount,
        totalAbsent: absentCount,
        totalLeaves: leaveCount,
        totalHoliday: holidayCount,
        totalUsers: totalUsers,

        attendanceData: userAttendance.map((attendance) => {
          return {
            ...attendance,
            punchBy: punchBy,
          };
        }),
      };

      return res.status(200).json(result);
    } 
    else if (createdAtFrom && createdAtTo) {
      const startDate = new Date(createdAtFrom);
      const endDate = new Date(createdAtTo);
      endDate.setHours(23, 59, 59);

      if (isNaN(startDate) || isNaN(endDate)) {
        return res.status(400).json({ message: "Invalid date parameters." });
      }
      attendanceQuery.where = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        // userId: user.id,
      };

      const userAttendance = await prisma.attendance.findMany({
        ...attendanceQuery,
      });

      // Calculate total present leaves and absent records
      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;
      let holidayCount = 0
      const totalUsers = await prisma.user.count({
        where: {
          status: true,
        },
      });


      userAttendance.forEach((attendance) => {
        if (attendance.attendenceStatus === "present") {
          presentCount++;
        } else if (attendance.attendenceStatus === "absent") {
          absentCount++;
        }
        else if (attendance.attendenceStatus === "leave") {
          leaveCount++;
        }
        else if (attendance.attendenceStatus === "holiday") {
          holidayCount++;
        }
      });
      const punchByIds = userAttendance
        .map((item) => item.punchBy) // Get an array of punchBy values
        .filter((id) => id !== null && id !== undefined);
      let punchBy;

      if (punchByIds.length > 0) {
        // If there are non-null and non-undefined punchByIds, fetch corresponding users
        punchBy = await prisma.user.findMany({
          where: {
            id: { in: punchByIds },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        });
      } else {
        // If all punchByIds are null or undefined, set punchBy to an empty array
        punchBy = [];
      }
      const result = {
        totalPresent: presentCount,
        totalAbsent: absentCount,
        totalLeaves: leaveCount,
        totalHoliday: holidayCount,
        totalUsers: totalUsers,

        attendanceData: userAttendance.map((attendance) => {
          return {
            ...attendance,
            punchBy: punchBy,
          };
        }),
      };

      return res.status(200).json(result);
    }
    else {
      return res.status(400).json({ message: "Invalid query parameters." });
    }
  } catch (error) {
    return res.status(500).json({ message: "An error occurred while fetching attendance records.", error: error.message });
  }
};
const updateSingleAttendence = async (req, res) => {
  try {
    const existingAttendence = await prisma.attendance.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });

    if (!existingAttendence) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    const isLate = moment(existingAttendence.startTime).isBefore(existingAttendence.inTime);
    const isEarly = moment(existingAttendence.startTime).isAfter(existingAttendence.inTime);
    const isOutEarly = moment(existingAttendence.endTime).isAfter(existingAttendence.outTime);
    const isOutLate = moment(existingAttendence.endTime).isBefore(existingAttendence.outTime);

    const updatedAttendenceData = {
      locationName: req.body.locationName || existingAttendence.locationName,
      latitude: req.body.latitude || existingAttendence.latitude,
      longitude: req.body.longitude || existingAttendence.longitude,
      inTime: req.body.inTime || existingAttendence.inTime,
      outTime: req.body.outTime || existingAttendence.outTime,
      punchBy: req.auth.sub || existingAttendence.punchBy,
      comment: req.body.comment || existingAttendence.comment,
      ip: req.body.ip || existingAttendence.ip,
      inTimeStatus: isEarly ? "Early" : isLate ? "Late" : "On Time",
      outTimeStatus: isOutEarly ? "Early" : isOutLate ? "Late" : "On Time",
    };

    const updatedAttendence = await prisma.attendance.update({
      where: {
        id: Number(req.params.id),
      },
      data: updatedAttendenceData,
    });

    return res.status(200).json({
      updatedAttendence,
      message: "Attendence updated successfully"
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
const deleteSingleAttendence = async (req, res) => {
  try {
    const attendanceId = Number(req.params.id);
    const foundAttendence = await prisma.attendance.findUnique({
      where: {
        id: attendanceId,
      },
    });

    if (!foundAttendence) {
      return res.status(404).json({
        message: "Attendance not found",
      });
    }

    const deletedAttendance = await prisma.attendance.delete({
      where: {
        id: attendanceId,
      },
    });

    return res.status(200).json({
      message: "Attendance deleted successfully",
    });
  } catch (error) {
    return res.status(400).json(error.message);
  }
};
const createAttendanceonleave = async (req, res) => {
  try {
    const id = parseInt(req.body.userId);

    if (
      !(id === req.auth.sub) &&
      !req.auth.permissions.includes("create-attendance")
    ) {
      return res.status(401).json({
        message: "Unauthorized. You are not authorized to give attendance",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
      include: {
        shift: true,
      },
    });
    const today = moment(req.body.acceptLeaveFrom).startOf("day");
    const endDay = moment(req.body.acceptLeaveTo).startOf("day");

    // Calculate leave duration in days
    const leaveDurationDays = moment(endDay).diff(today, "days") + 1;

    // Check if leave status is changing from 'APPROVED' to 'REJECTED'
    if (req.body.fromleave && req.body.status === 'REJECTED') {
      // Delete existing attendance entries for the leave duration
      await prisma.attendance.deleteMany({
        where: {
          userId: id,
          date: {
            gte: today.toDate(),
            lte: endDay.toDate(),
          },
        },
      });

      return res.status(200).json({
        message: "Leave status updated successfully",
      });
    }

    // Create an array to store attendance creation promises
    const attendanceCreationPromises = [];

    // Loop through each day of leave and create attendance
    for (let i = 0; i < leaveDurationDays; i++) {
      const attendanceDate = moment(today).add(i, "days").toDate();
      const attendance = await prisma.attendance.findFirst({
        where: {
          userId: id,
          date: attendanceDate,
        },
      });

      if (!attendance) {
        const attendancePromise = prisma.attendance.create({
          data: {
            userId: id,
            inTime: null,
            outTime: null,
            punchBy: req.auth.sub,
            inTimeStatus: null,
            outTimeStatus: null,
            comment: null,
            date: attendanceDate,
            attendenceStatus: req.body.attendenceStatus
              ? req.body.attendenceStatus
              : "leave",
            ip: null,
            totalHour: null,
            createdAt: attendanceDate,
            // updatedAt:attendanceDate,

          },
        });
        attendanceCreationPromises.push(attendancePromise);
      }
    }

    // Execute all attendance creation promises concurrently
    await Promise.all(attendanceCreationPromises);

    if (req.body.fromleave) {
      return res.status(200).json({
        attendanceCreationPromises,
        message: "Leave status updated successfully"
      });
    } else {
      return res.status(200).json({
        message: "Clock in Successfully",
      });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
function sendnotifiy(Title, Body, Desc, Token) {
  try {
    const message = {
      notification: {
        title: Title,
        body: Body,
      },
      token: Token,
    };
    admin
      .messaging()
      .send(message)
      .then((response) => { console.log("Notification Send ....") })
      .catch((error) => {
        console.log("Error sending notification:", error);
      });

  } catch (error) {
    console.log("Error:", error);
  }
}



module.exports = {
  createAttendance,
  getAllAttendance,
  getSingleAttendance,
  getAttendanceByUserId,
  getLastAttendanceByUserId,
  search,
  updateSingleAttendence,
  deleteSingleAttendence,
  getTodayAttendanceByUserId,
  createadminAttendance,
  createAttendanceonleave,
};
