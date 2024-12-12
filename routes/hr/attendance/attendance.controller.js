const { getPagination } = require("../../../utils/query");
//const moment = require("moment");
const prisma = require("../../../utils/prisma");
const Sequelize = require("sequelize"); // Assuming you're using Sequelize for PostgreSQL
const Op = Sequelize.Op;
const moment = require("moment-timezone");

const operatorsAliases = {
  $between: Op.between, //create an alias for Op.between
}
const admin = require("firebase-admin");
var FCM = require("fcm-node");
const {date} = require("yarn/lib/cli");
const { log } = require("winston");

const createAttendance = async (req, res) => {
  try {
    let id ;
    if(req?.body?.admin)
    {
      empid = req.body.employeeId;
      const userfromadmin = await prisma.user.findUnique({
        where: { employeeId: empid },
      });

      id= userfromadmin.id;

    }
    else
    {
      id =   req.auth.sub;
      
    }
   


    let inTimeStatus = "OnTime";
    let outTimeStatus;

    // Check user authorization
    if (!req.auth.permissions.includes("create-attendance")) {
      return res.status(401).json({
        message: "Unauthorized. You are not authorized to give attendance",
      });
    }

    // Get current date and time in Europe/London

        let currentTimeLondon = moment().tz("Europe/London");
        let todayLondon ;
        let currentLTimeAndDate;
        let currentLTime;
        let currentOutTime;
        let currentOutTimeAndDate;
        let currentInTimeAndDate;


    if(req?.body?.admin)
      {
         currentTimeLondon = moment().tz("Europe/London");
         todayLondon = moment(req.body.date).format("YYYY-MM-DD");
         currentLTimeAndDate = moment(req.body.date).format("YYYY-MM-DD HH:mm:ss");
         currentLTime = moment(req.body.checkinTime).format("HH:mm:ss");
         currentOutTime = moment(req.body.checkoutTime).format("HH:mm:ss");
         currentOutTimeAndDate = moment(req.body.checkoutTime).format("YYYY-MM-DD HH:mm:ss");
         currentInTimeAndDate = moment(req.body.checkinTime).format("YYYY-MM-DD HH:mm:ss");
         
      }
      else
      {
         currentTimeLondon = moment().tz("Europe/London");
         todayLondon = currentTimeLondon.format("YYYY-MM-DD");
         currentLTimeAndDate = currentTimeLondon.format("YYYY-MM-DD HH:mm:ss");
         currentLTime = currentTimeLondon.format("HH:mm:ss");
        
      }
    
      
   


    const user = await prisma.user.findFirst({
          where: {
            id: id,
            applicationStatus: 'APPROVED',
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
        message: "Today's shift not found" ,
      });
    }

    // Find attendance for today
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: id,
        date:  todayLondon,
      },
    });

         


    let scheduleForToday = [];

    // Find today's schedule
    user.shifts.forEach((shift) => {
      shift.schedule.forEach((schedule) => {
        if (schedule.startTime !== null && schedule.status==true) {
          const scheduleDateLondon = schedule.shiftDate;
          
          if (scheduleDateLondon == moment(todayLondon).format("YYYY-MM-DD")) {
            scheduleForToday.push(schedule);
          }
        }
      });
    });

  

   
    if (scheduleForToday.length === 0) {
      return res.status(400).json({ message: "Today's shift is not found" });
    }

    
    // Parse shift start and end times
    const startTimeUTC = moment(scheduleForToday[0].startTime).format("HH:mm:ss");
    const endTimeUTC = moment(scheduleForToday[0].endTime).format("HH:mm:ss");

    // Convert times to Europe/London for comparison
    const startTimeLondon = startTimeUTC;
    const endTimeLondon = endTimeUTC;
    if (req?.body?.admin) {
      if (currentLTime <= startTimeLondon) {
        inTimeStatus = "OnTime";
      } else {
        inTimeStatus = "Late";
      }

      if (currentOutTime >= endTimeLondon) {
        outTimeStatus = "OnTime";
      } else {
        outTimeStatus = "Early";
      }
    } else {
      if (currentLTime <= startTimeLondon) {
        inTimeStatus = "OnTime";
      } else {
        inTimeStatus = "Late";
      }

      if (currentLTime >= endTimeLondon) {
        outTimeStatus = "OnTime";
      } else {
        outTimeStatus = "Early";
      }
    }
    // Determine attendance status
    // if (currentLTime <= startTimeLondon) {
    //   inTimeStatus = "OnTime";
    // } else {
    //   inTimeStatus = "Late";
    // }

    // if (currentOutTime >= endTimeLondon) {
    //   outTimeStatus = "OnTime";
    // } else {
    //   outTimeStatus = "Early";
    // }

// need to dell


    // Check for existing attendance records
    const existingCheckOut = await prisma.attendance.findFirst({
      where: {
        userId: id,
        date: todayLondon,
        inTime: {
          not: null,  // Ensures inTime is not null
        },
        outTime: {
          not: null  // Ensures outTime is not null
        }
      },
    });

    if (attendance && existingCheckOut) {
      return res.status(400).json({
        message: "Today's attendance has already been marked.",
      });
    }
// till here


    let inTimeUTC = currentLTime;
    const dateUTC = moment(todayLondon).format("YYYY-MM-DD");

    if (!attendance) 
    {
      // Clock in
      if(req.body.attendenceStatus == "absent" || req.body.attendenceStatus == "holiday")
      {
          inTimeUTC = null;
          inTimeStatus = null;
          
      }
        const createdAtDate = moment(dateUTC, "YYYY-MM-DD HH:mm:ss").toDate();

      const newAttendance = await prisma.attendance.create({
        data: {
          userId: id,
          inTime: inTimeUTC,
          outTime: null,
          punchBy: req.auth.sub,
          comment: req.body.comment || null,
          date: dateUTC,
          attendenceStatus: req.body.attendenceStatus || "present",
          inTimeStatus: inTimeStatus,
          outTimeStatus: null,
          createdAt: createdAtDate,
        },  
      });

      if(req?.body?.admin)
      {

        const timeDiff = moment(currentOutTimeAndDate).diff(moment(moment(currentInTimeAndDate).format("YYYY-MM-DD HH:mm:ss")));

        // Convert milliseconds into human-readable form
        const duration = moment.duration(timeDiff);
        const hours = Math.floor(duration.asHours()); // Gets the total hours as a whole number
        const minutes = duration.minutes(); 
  
  const formattedHoursduty = String(hours).padStart(2, "0");
        const formattedMinutesduty = String(minutes).padStart(2, "0");
  
        // Calculate overtime
         const scheduledWorkHour = scheduleForToday[0].workHour;
        // const overtimeHours = Math.max(0, hours - scheduledWorkHour);
        // const overtimeWithBuffer = overtimeHours >= 0.30 ? overtimeHours : 0;
        // let overtime = overtimeWithBuffer.toFixed(2);
        
        let overtimeHours = 0;
        let overtimeMinutes = 0;
        let overtime = "00:00";


        if (timeDiff > 30 * 60 * 1000) { // 30 minutes in milliseconds
        const totalWorkedHours = hours + minutes / 60; // Convert total time to hours (including minutes as fraction)
    
        if (totalWorkedHours > scheduledWorkHour) {
            overtime = totalWorkedHours - scheduledWorkHour;
            if (overtime >= 0.5) { // Check if overtime is at least 30 minutes
                overtimeHours = Math.floor(overtime); // Get whole hours of overtime
                overtimeMinutes = Math.round((overtime - overtimeHours) * 60); // Get remaining minutes as whole number
            } 
            
            }
        }
         const formattedHours = String(overtimeHours).padStart(2, "0");
        const formattedMinutes = String(overtimeMinutes).padStart(2, "0");
        let overtimecombine = formattedHours + ":" + formattedMinutes;
     
        
        let totalhourcombine = formattedHoursduty + ':' + formattedMinutesduty;
        
          if(req.body.attendenceStatus == "absent" || req.body.attendenceStatus == "holiday")
              {
                  currentOutTime = null;
                  overtime = null;
                  totalhourcombine = null;
                  outTimeStatus = "Attendence Marked by admin";
                  overtimecombine = null;
                  
              }
      
        const newAttendance1 = await prisma.attendance.update({
          where: {
            id: newAttendance.id,
          },
          data: {
            outTime:  currentOutTime, 
            overtime: overtimecombine,
            totalHour: totalhourcombine,
            outTimeStatus: outTimeStatus,
          },
        });

        return res.status(200).json({
          newAttendance1,
          message: "Attendence marked successfully.",
        });

      }
      return res.status(200).json({
        newAttendance,
        message: "Clock in marked successfully.",
      });

    } 
    else {

        let currentInTimeAndDate = moment(todayLondon + " " + attendance.inTime, "YYYY-MM-DD HH:mm").format("YYYY-MM-DD HH:mm:ss");


       const timeDiff = moment(currentLTimeAndDate).diff(moment(moment(currentInTimeAndDate).format("YYYY-MM-DD HH:mm:ss")));

      // Convert milliseconds into human-readable form
        const duration = moment.duration(timeDiff);
        const hours = Math.floor(duration.asHours()); // Gets the total hours as a whole number
        const minutes = duration.minutes(); 
          let overtime = "00:00";

   const formattedHoursduty = String(hours).padStart(2, "0");
        const formattedMinutesduty = String(minutes).padStart(2, "0");
  
  
        // Calculate overtime
         const scheduledWorkHour = scheduleForToday[0].workHour;
        // const overtimeHours = Math.max(0, hours - scheduledWorkHour);
        // const overtimeWithBuffer = overtimeHours >= 0.30 ? overtimeHours : 0;
        // let overtime = overtimeWithBuffer.toFixed(2);
        
        let overtimeHours = 0;
        let overtimeMinutes = 0;

        if (timeDiff > 30 * 60 * 1000) { // 30 minutes in milliseconds
            const totalWorkedHours = hours + minutes / 60; // Convert total time to hours (including minutes as fraction)
            if (totalWorkedHours > scheduledWorkHour) {
                const overtime = totalWorkedHours - scheduledWorkHour;
                if (overtime >= 0.5) { // Check if overtime is at least 30 minutes
                    const overtimeH = Math.floor(overtimeHours);
                    const overtimeM = Math.round((overtimeHours - overtimeH ) * 60);
                    overtime = `${overtimeH}:${overtimeM}`;
                } 
            }
        }
           const formattedHours = String(overtimeHours).padStart(2, "0");
        const formattedMinutes = String(overtimeMinutes).padStart(2, "0");
        let overtimecombine = formattedHours + ":" + formattedMinutes;
       
        
        let totalhourcombine = formattedHoursduty + ':' + formattedMinutesduty;

      const newAttendance = await prisma.attendance.update({
        where: {
          id: attendance.id,
        },
        data: {
          outTime: currentLTime,
          overtime: overtimecombine,
          totalHour:  totalhourcombine,
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
          totalHour: totalHours,
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
          totalHour: String(formattedTotalHours),
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
            designationHistory: {
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
        return res
          .status(400)
          .json({ message: "Invalid createdAtFrom or createdAtTo parameter." });
      }
    } else {
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

    // Fetch punchBy users if necessary
    const punchByIds = allAttendance
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

    // Now, for each attendance record, fetch the shift and schedule
    const attendanceDataWithShifts = await Promise.all(
      allAttendance.map(async (attendance) => {
        const attendanceDate = new Date(attendance.date);
        const startOfDay = new Date(attendanceDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(attendanceDate);
        endOfDay.setHours(23, 59, 59, 999);

        const dayOfWeek = attendanceDate.toLocaleDateString("en-US", {
          weekday: "long",
        });
        const formattedAttendanceDate = attendanceDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        console.log(attendance.date, "attendance.date")
        // Fetch the shift for the user on the attendance date
        const shiftDetail = await prisma.shifts.findFirst({
          where: {
            userId: attendance.userId,
            shiftFrom: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          include: {
            schedule: {
              where: {
                day: dayOfWeek,
                shiftDate: formattedAttendanceDate,  // Filter by the specific shift date
              },
            },
          },
        });

        // Add the shift and schedule to the attendance record
        return {
          ...attendance,
          shift: shiftDetail,
        };
      })
    );

    // Construct the result object
    const result = {
      attendanceData: attendanceDataWithShifts.map((attendance) => {
        const response = {
          ...attendance,
          punchBy: punchBy,
          totalHours: null,
          totalMinutes: null,
        };

        if (
          attendance.attendenceStatus === "present" &&
          attendance.inTime &&
          attendance.outTime
        ) {
          const checkInTime = new Date(attendance.inTime);
          const checkOutTime = new Date(attendance.outTime);
          const timeDiff = checkOutTime - checkInTime;
          response.totalHours = Math.floor(
            timeDiff / (1000 * 60 * 60)
          )
            .toString()
            .padStart(2, "0");
          response.totalMinutes = Math.floor(
            (timeDiff % (1000 * 60 * 60)) / (1000 * 60)
          )
            .toString()
            .padStart(2, "0");
        }

        return response;
      }),
      totaldays: {
        totalPresent: allAttendance.filter(
          (attendance) => attendance.attendenceStatus === "present"
        ).length,
        totalLeave: allAttendance.filter(
          (attendance) => attendance.attendenceStatus === "leave"
        ).length,
        totalAbsent: allAttendance.filter(
          (attendance) => attendance.attendenceStatus === "absent"
        ).length,
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
    
    let currentTimeLondon = moment().tz("Europe/London");
    const  today = currentTimeLondon.format("YYYY-MM-DD");
         
    
    const userId = parseInt(req.params.id);

    const userLeavePolicy = await prisma.user.findUnique({
      where: {
        id: userId,
        applicationStatus: 'APPROVED',
      },
      select: {
        leavePolicy: true, // Assuming you have a 'leavePolicy' field in the User model
      },
    });
    const userweeklyHolidays = await prisma.user.findUnique({
      where: {
        id: userId,
        applicationStatus: 'APPROVED',
      },
      select: {
        weeklyHoliday: true, // Assuming you have a 'leavePolicy' field in the User model
      },
    });

    const todayAttendance = await prisma.attendance.findFirst({
      where: {
        userId: userId,
        date: today
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
    console.log(todayAttendance, "todayAttendance")

    if (!todayAttendance) {

      response.attendenceStatus = "initiall";
      response.isadmin = null;
      return res.status(200).json(response);
    }
    console.log(todayAttendance, "todayAttendance")
    const todayDayOfWeek = moment(today).format("cccc");

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
        response.totalHours = todayAttendance.totalHour;
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

  const { query, employeeId, createdAtFrom, createdAtTo, id } = req.query;
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
      let holidayCount = 0;
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
        } else if (attendance.attendenceStatus === "leave") {
          leaveCount++;
        } else if (attendance.attendenceStatus === "holiday") {
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

      // Fetch shift details for each attendance
      const attendanceData = await Promise.all(
          allAttendance.map(async (attendance) => {
            // Convert attendance.date to Europe/London time zone
            const attendanceDate = moment(attendance.date).tz('Europe/London');
            const dayOfWeek = attendanceDate.format('dddd'); // Get day of the week, e.g., 'Wednesday'
            const startOfDay = new Date(); // This would be the start of the day you're interested in
            startOfDay.setHours(0, 0, 0, 0); // Set to start of the day at midnight

            const endOfDay = new Date(startOfDay); // Clone the start date
            endOfDay.setHours(23, 59, 59, 999);

            const shiftDetail = await prisma.user.findUnique({
              where: { id: attendance.userId },
              include: {
                shifts: {
                  where: {
                    // createdAt: {
                    //   gte: startOfDay,
                    //   lte: endOfDay
                    // },
                  },
                  include: {
                    schedule: {
                      where: {
                        // day: dayOfWeek,
                        // createdAt: new Date(),
                        // status: true, // Optional: Only include active schedules
                      },
                    },
                  },
                },
              },
            });
``
            return {
              ...attendance,
              punchBy: punchBy,
              shiftDetail: shiftDetail,
            };
          })
      );


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
        attendanceData: attendanceData,
      };
      return res.status(200).json(result);
    }
    else if (id && createdAtFrom && createdAtTo) {
      try {
        const startDate = new Date(createdAtFrom);
        const endDate = new Date(createdAtTo);
        endDate.setHours(23, 59, 59);
        console.log(id, "id");
        let validUserId = !isNaN(id);
        console.log(validUserId, "validUserId")
        console.log(validUserId ? id : "");
        
        const user = await prisma.user.findUnique({
          where: {
            id: Number(validUserId ? id : ""),
          },
        });
        console.log(user, "user");
        
    
        if (!user) {
          return res.status(404).json({ message: "User not found with the provided ID." });
        }
    
        const userAttendance = await prisma.attendance.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            userId: user.id,
          },
          ...attendanceQuery,
        });
    
        // Calculate counts
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
    
        // Fetch punchBy users
        const punchByIds = userAttendance
          .map((item) => item.punchBy)
          .filter((id) => id !== null && id !== undefined);
    
        let punchBy = [];
    
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
        }
    
        // Fetch shift details for each attendance
        const attendanceData = await Promise.all(
          userAttendance.map(async (attendance) => {
            const attendanceDate = new Date(attendance.date);
            attendanceDate.setUTCHours(0, 0, 0, 0);
    
            const shiftDetail = await prisma.user.findUnique({
              where: { id: attendance.userId },
              include: {
                shifts: {
                  where: {
                    // createdAt: {
                    //   gte: startOfDay,
                    //   lte: endOfDay
                    // },
                  },
                  include: {
                    schedule: {
                      where: {
                        // day: dayOfWeek,
                        // createdAt: new Date(),
                        // status: true, // Optional: Only include active schedules
                      },
                    },
                  },
                },
              },
            });
    
            return {
              ...attendance,
              punchBy: punchBy,
              shiftDetail: shiftDetail,
            };
          })
        );
    
        const result = {
          totalPresent: presentCount,
          totalAbsent: absentCount,
          totalLeaves: leaveCount,
          totalHoliday: holidayCount,
          attendanceData: attendanceData,
        };
    
        return res.status(200).json(result);
      } catch (error) {
        return res.status(500).json({
          message: "An error occurred while fetching attendance records.",
          error: error.message,
        });
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
        userId: user.id,
      };

      const userAttendance = await prisma.attendance.findMany({
        ...attendanceQuery,
      });

      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;
      let holidayCount = 0;
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
        } else if (attendance.attendenceStatus === "leave") {
          leaveCount++;
        } else if (attendance.attendenceStatus === "holiday") {
          holidayCount++;
        }
      });
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

      // Fetch shift details for each attendance
      const attendanceData = await Promise.all(
          userAttendance.map(async (attendance) => {
            const shiftDetail = await prisma.shift.findFirst({
              where: {
                userId: attendance.userId,
                schedule: {
                  some: {
                    shiftDate: attendance.date,
                  },
                },
              },
              include: {
                schedule: {
                  where: {
                    shiftDate: attendance.date,
                  },
                },
              },
            });

            return {
              ...attendance,
              punchBy: punchBy,
              shiftDetail: shiftDetail,
            };
          })
      );

      const result = {
        totalPresent: presentCount,
        totalAbsent: absentCount,
        totalLeaves: leaveCount,
        totalHoliday: holidayCount,
        totalUsers: totalUsers,
        attendanceData: attendanceData,
      };

      return res.status(200).json(result);
    }
    else if (createdAtFrom && createdAtTo) {
      console.log("Filtering by dates");
      const startDate = new Date(createdAtFrom);
      const endDate = new Date(createdAtTo);
      endDate.setHours(23, 59, 59, 999);  // Ensure the endDate includes all activities of the last day
    
      // Check the validity of startDate and endDate
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date parameters." });
      }
    
      attendanceQuery.where = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };
    
      const userAttendance = await prisma.attendance.findMany({
        ...attendanceQuery,
      });
    
      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;
      let holidayCount = 0;
    
      // Loop through the fetched attendance records to calculate status counts
      userAttendance.forEach((attendance) => {
        switch (attendance.attendenceStatus) {
          case "present":
            presentCount++;
            break;
          case "absent":
            absentCount++;
            break;
          case "leave":
            leaveCount++;
            break;
          case "holiday":
            holidayCount++;
            break;
        }
      });
    
      // Retrieve IDs for punchBy to fetch user details later
      const punchByIds = userAttendance.map(item => item.punchBy).filter(id => id != null);
      let punchBy = [];
    
      if (punchByIds.length > 0) {
        punchBy = await prisma.user.findMany({
          where: {
            id: {
              in: punchByIds,
            },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        });
      }
    
      // Fetch shift details for each attendance record
      const attendanceData = await Promise.all(
        userAttendance.map(async (attendance) => {
          const shiftDetail = await prisma.user.findUnique({
            where: { id: attendance.userId },
            include: {
              shifts: {
                where: {
                  // createdAt: {
                  //   gte: startOfDay,
                  //   lte: endOfDay
                  // },
                },
                include: {
                  schedule: {
                    where: {
                      // day: dayOfWeek,
                      // createdAt: new Date(),
                      // status: true, // Optional: Only include active schedules
                    },
                  },
                },
              },
            },
          });
    
          return {
            ...attendance,
            punchBy: punchBy,
            shiftDetail: shiftDetail,
          };
        })
      );
    
      const result = {
        totalPresent: presentCount,
        totalAbsent: absentCount,
        totalLeaves: leaveCount,
        totalHoliday: holidayCount,
        totalUsers: punchByIds.length,  // Adjusted to count the unique users involved in the period
        attendanceData: attendanceData,
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
    
    const leave = await prisma.leaveApplication.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        user: true,
      },
    });
    
    if(!leave)
    {
       return res.status(401).json({
        message: "Leave is not found",
      }); 
    }
    const id    =    leave.userId;
    
      
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
    if (req.body.acceptLeaveFrom && req.body.status === 'REJECTED') {
      // Delete existing attendance entries for the leave duration
     

        let check = await prisma.attendance.deleteMany({
          where: {
            userId: id,
            date: {
              gte: moment(today).format('YYYY-MM-DD'),
              lte: moment(endDay).format('YYYY-MM-DD'),
            },
          },
        });
     return res.status(200).json({
        message: "Leave Rejected Successfully.",
      });

    }
    
 

    // Create an array to store attendance creation promises
    const attendanceCreationPromises = [];

    // Loop through each day of leave and create attendance
   
        for (let i = 0; i < leaveDurationDays; i++) {
            
            const currentDate = moment(today).add(i, "days"); // Get the current date in the loop
            const dayOfWeek = currentDate.day(); // Get the day of the week, where 0 is Sunday and 6 is Saturday
        
            // Skip processing for Saturday (6) and Sunday (0)
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                continue; // Skip to the next iteration of the loop
            }
    
        const formattedDate = moment(today).add(i, "days").format('YYYY-MM-DD'); // Format date as string
        const date = moment(today).add(i, "days").toDate(); 
          const attendance = await prisma.attendance.findFirst({
            where: {
              userId: id,
              date: formattedDate, // Use formatted string date
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
                overtime:null,
                comment: null,
                date: formattedDate, // Use formatted string date
                attendenceStatus: req.body.attendenceStatus ? req.body.attendenceStatus : "leave",
                ip: null,
                totalHour: null,
                createdAt: date, // Use new Date() for creation timestamp
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
