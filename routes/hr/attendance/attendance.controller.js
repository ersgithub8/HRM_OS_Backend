const { getPagination } = require("../../../utils/query");
const moment = require("moment");
const prisma = require("../../../utils/prisma");
const Sequelize  = require("sequelize"); // Assuming you're using Sequelize for PostgreSQL
const Op = Sequelize.Op;
const operatorsAliases = {
  $between: Op.between, //create an alias for Op.between
}


//create a new employee
const createAttendance = async (req, res) => {
  try {
    const id = parseInt(req.body.userId);
    if (
      !(id === req.auth.sub) &&
      !req.auth.permissions.includes("create-attendance")
    ) {
      return res.status(401).json({
        message: "Unauthorized. You are not authorize to give attendance",
      });
    }
    // get user shift
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
      include: {
        shift: true,
      },
    });

//     // format time
//     const startTime = moment(user.shift.startTime, "HH:mm");

//     const endTime = moment(user.shift.endTime, "HH:mm");

//     console.log(startTime);
//     const curTime = moment(new Date()).format("HH:mm") ;
// console.log(curTime);
//     const isLate = moment().isAfter(startTime);
//     const isEarly = moment().isBefore(startTime);
//     console.log(isLate, "late");
//     console.log(isEarly, "early");

      const startTime = moment(new Date()).format('HH:mm'); // Example start time
      const endTime = moment(user?.shift?.startTime).format('HH:mm');   // Example end time
      console.log("..............................", startTime, endTime)
      const startTimeParts = startTime.split(':');
      const endTimeParts = endTime.split(':');
      const startHour = parseInt(startTimeParts[0], 10);
      const startMinute = parseInt(startTimeParts[1], 10);

      const endHour = parseInt(endTimeParts[0], 10);
      const endMinute = parseInt(endTimeParts[1], 10);

      const totalMinutesStart = startHour * 60 + startMinute;
      const totalMinutesEnd = endHour * 60 + endMinute;

      const timeDifferenceMinutes = totalMinutesEnd - totalMinutesStart;
let inTimeStatus
      console.log("Time difference .....", timeDifferenceMinutes);
      if (timeDifferenceMinutes >= 0) {
        inTimeStatus="OnTime"
      }
      else{
        inTimeStatus="Late"
      }
      //     const startTime = moment(user.shift.startTime, "HH:mm");

    const endTimes = moment(user.shift.endTime, "HH:mm");
    // const isOutEarly = moment().isBefore(endTimes);
    // const isOutLate = moment().isAfter(endTimes);
    let outTimeStatus
    if (timeDifferenceMinutes >= 0) {
      outTimeStatus="OnTime"
    }
    // else if(timeDifferenceMinutes <= 0)
    // {
    //   outTimeStatus="Early"
    // }
    else{
      outTimeStatus="OnTime"
    }
    const today = moment().startOf('day');
    const tomorrow = moment(today).add(1, 'days');
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: id,
        inTime: {
          gte: today.toDate(),
          lt: tomorrow.toDate(),
        },
      },
    });
    
  const existingCheckOut = await prisma.attendance.findFirst({
    where: {
      userId: id,
      outTime: {
        gte: today.toDate(),
        lt: tomorrow.toDate(),
      },
    },
  });
    if (attendance&&existingCheckOut) {
      return res.status(400).json({
        message: "Clock in has already been marked for today.",
      });
    }

    if (req.query.query === "manualPunch") {
      const inTime = new Date();
      const date = new Date();
      const outTime = new Date();

      const totalHours = Math.abs(outTime - inTime) / (1000 * 60 * 60);

      const newAttendance = await prisma.attendance.create({
        data: {
          userId: id,
          inTime: inTime,
          outTime: outTime,
          punchBy: req.auth.sub,
          inTimeStatus: req.body.inTimeStatus ? req.body.inTimeStatus : null,
          outTimeStatus: req.body.outTimeStatus ? req.body.outTimeStatus : null,
          comment: req.body.comment ? req.body.comment : null,
          date: req.body.date ? req.body.date : new Date(),
          attendenceStatus:req.body.attendenceStatus ? req.body.attendenceStatus:"present",
          ip: req.body.ip ? req.body.ip : null,
          totalHour: parseFloat(totalHours.toFixed(3)),
        },
      });
      return res.status(200).json({
        newAttendance,
        message:"Clock in Successfully"
      });
    } else if (attendance === null) {
      const inTime = new Date(moment.now());
      const newAttendance = await prisma.attendance.create({
        data: {
          userId: id,
          inTime: inTime,
          outTime: null,
          punchBy: req.auth.sub,
          comment: req.body.comment ? req.body.comment : null,
          ip: req.body.ip ? req.body.ip : null,
          date: req.body.date ? req.body.date :new Date(),
          attendenceStatus: req.body.attendenceStatus ? req.body.attendenceStatus:"present",
          inTimeStatus,
          outTimeStatus: null,
        },
      });

      // if (req.body.fromleave){
      //   return res.status(200).json({
      //     newAttendance: newAttendance,
      //     grantedLeave : req.body.grantedLeave,
      //     message: 'Application status is updated',
      //   });
      // }else{
      //   return res.status(200).json({
      //     newAttendance,
      //     message:"Clock in Successfully"
      //   });
      // }
      return res.status(200).json({
        newAttendance,
        message:"Clock in Successfully"
      });
    } else  {
      const outTime = new Date(moment.now());
      const timeDifferenceMs = Math.abs(outTime - attendance.inTime);
      const totalMinutes = timeDifferenceMs / 60000; // 60000 milliseconds in a minute
   
      const newAttendance = await prisma.attendance.update({
        where: {
          id: attendance.id,
        },
        data: {
          outTime: outTime,
          totalHour: parseFloat(totalMinutes.toFixed(0)),
          outTimeStatus: outTimeStatus,

        },
      });
      return res.status(200).json({
        newAttendance,
        message:"Clock out Successfully"
      });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

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
        shift: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found with the provided employeeId." });
    }
    

    const today = moment(date).startOf('day');
    const tomorrow = moment(today).add(1, 'days');

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: today.toDate(),
          lt: tomorrow.toDate(),
        },
      },
    });
    if (attendance) {
      return res.status(400).json({ message: "Attendance already exists on this date." });
    }

    if (req.query.query === "manualPunch") {
      const newAttendance = await prisma.attendance.create({
        data: {
          userId: user.id,
          inTime: null,
          outTime: null,
          punchBy: req.auth.sub,
          inTimeStatus: null,
          outTimeStatus: null,
          comment: null,
          date: date,
          attendenceStatus: attendenceStatus,
          ip: null,
          totalHour: null,
          createdAt:date,
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
      message:"Attendence created successfully"});
    } else if (!attendance) {
      const newAttendance = await prisma.attendance.create({
        data: {
          userId: user.id,
          inTime: null,
          outTime: null,
          punchBy: req.auth.sub,
          inTimeStatus: null,
          outTimeStatus: null,
          comment: null,
          date: date,
          attendenceStatus: attendenceStatus,
          ip: null,
          totalHour: null,
          createdAt:date,

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
        message:"Attendence created successfully"});
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

      return res.status(200).json({
        // result,
        message:"Attendence created successfully"});
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};


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
          employeeId:true,

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
        employeeId:true,

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
          employeeId:true,

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
          employeeId:true,
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

// const getAttendanceByUserId = async (req, res) => {
//   try {
//     const allAttendance = await prisma.attendance.findMany({
//       where: {
//         userId: parseInt(req.params.id),
//       },
//       orderBy: [
//         {
//           id: "asc",
//         },
//       ],
//       include: {
//         user: {
//           select: {
//             firstName: true,
//             lastName: true,
//           },
//         },
//       },
//     });

//     const punchBy = await prisma.user.findMany({
//       where: {
//         id: { in: allAttendance.map((item) => item.punchBy) },
//       },
//       select: {
//         id: true,
//         firstName: true,
//         lastName: true,
//       },
//     });
//     const result = allAttendance.map((attendance) => {
//       return {
//         ...attendance,
//         punchBy: punchBy,
//       };
//     });

//     return res.status(200).json(result);
//   } catch (error) {
//     return res.status(400).json({ message: error.message });
//   }
// };


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
      endDate.setHours(23,59,59);


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

    const punchBy = await prisma.user.findMany({
      where: {
        id: { in: allAttendance.map((item) => item.punchBy) },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

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

// const getAttendanceByUserId = async (req, res) => {
//   try {
//     const userId = parseInt(req.params.id);
//     const allAttendance = await prisma.attendance.findMany({
//       where: {
//         userId: userId,
//       },
//       orderBy: [
//         {
//           id: "asc",
//         },
//       ],
//       include: {
//         user: {
//           select: {
//             firstName: true,
//             lastName: true,
//             designationHistory: { // Assuming the designation information is in a related model
//               select: {
//                 designation: true,
//                 // Add other fields from designationHistory if needed
//               },
//             },
//           },
//         },
//       },
      
//     });

//     const punchBy = await prisma.user.findMany({
//       where: {
//         id: { in: allAttendance.map((item) => item.punchBy) },
//       },
//       select: {
//         id: true,
//         firstName: true,
//         lastName: true,
//       },
//     });

//     // Calculate total present, total leave, and total absent
//     let totalPresent = 0;
//     let totalLeave = 0;
//     let totalAbsent = 0;

//     allAttendance.forEach((attendance) => {
//       if (attendance.attendenceStatus === "Present") {
//         totalPresent++;
//       } else if (attendance.attendenceStatus === "Leave") {
//         totalLeave++;
//       } else if (attendance.attendenceStatus === "Absent") {
//         totalAbsent++;
//       }
//     });

//     const result = {
//       attendanceData: allAttendance.map((attendance) => {
//         return {
//           ...attendance,
//           punchBy: punchBy,
//         };
//       }),
//       totaldays: {
//         totalPresent: totalPresent,
//         totalLeave: totalLeave,
//         totalAbsent: totalAbsent,
//       },
//     };

//     return res.status(200).json(result);
//   } catch (error) {
//     return res.status(400).json({ message: error.message });
//   }
// };


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
// const getTodayAttendanceByUserId = async (req, res) => {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const todayAttendance = await prisma.attendance.findFirst({
//       where: {
//         userId: parseInt(req.params.id),
//         inTime: {
//           gte: today,
//         },
//       },
//       orderBy: [
//         {
//           id: 'desc',
//         },
//       ],
//     });

//     const response = {
//       inTime: null,
//       outTime: null,
//       totalHours: null,
//       totalMinutes: null,
//       totalSeconds: null,
//       attendenceStatus: null, 
//     };

//     if (!todayAttendance) {
//       // If there's no attendance record for today, return the empty response
//       response.attendenceStatus = null;
//       return res.status(200).json(response);
//     }

//     if (todayAttendance.inTime) {
//       response.inTime = todayAttendance.inTime;

//       if (todayAttendance.outTime) {
//         const checkInTime = new Date(todayAttendance.inTime);
//         const checkOutTime = new Date(todayAttendance.outTime);

//         const timeDiff = checkOutTime - checkInTime;
//         const totalHours = Math.floor(timeDiff / (1000 * 60 * 60));
//         const totalMinutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
//         const totalSeconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

//         response.outTime = todayAttendance.outTime;
//         response.totalHours = totalHours.toString().padStart(2, '0');
//         response.totalMinutes = totalMinutes.toString().padStart(2, '0');
//         response.totalSeconds = totalSeconds.toString().padStart(2, '0');
//         response.attendenceStatus = todayAttendance.attendenceStatus;

//       }
//        else {
//         response.attendenceStatus = todayAttendance.attendenceStatus; // Set attendanceStatus to 'Checked In'
//       }

//       return res.status(200).json(response);
//     }

//     // If no check-in time available, return the empty response with status 'Absent'
//     response.attendenceStatus = 'Absent';
//     return res.status(200).json(response);
//   } catch (error) {
//     return res.status(400).json({ message: error.message });
//   }
// };


const getTodayAttendanceByUserId = async (req, res) => {
  try {
    const today = new Date();
    console.log(today,"fdhsj");
    // return
    today.setHours(0, 0, 0, 0);

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
        },
      },
      orderBy: [
        {
          id: 'desc',
        },
      ],
    });
    console.log(todayAttendance);
let isadmin = null;

if (todayAttendance) {
  isadmin = todayAttendance.punchBy === todayAttendance.userId ? 'user' : 'admin';
}
    const response = {
      inTime: null,
      isadmin:isadmin,
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
      response.isadmin=null;
      return res.status(200).json(response);
    }

    // Get today's day of the week (0 = Sunday, 1 = Monday, ...)
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

    response.attendenceStatus =todayAttendance.attendenceStatus;
    return res.status(200).json(response);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const search = async (req, res) => {
  if (!req.auth.permissions.includes("readAll-attendance")) {
    return res.status(401).json({ message: "You are not able to access this route." });
  }

  const { query, employeeId, createdAtFrom, createdAtTo } = req.query;
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

      // Count present and absent records
      let presentCount = 0;
      let absentCount = 0;
      let leaveCount=0;
      let holidayCount=0
      const totalUsers =await prisma.user.count({
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
      const currentMonthCount = await prisma.user.count({
        where: {
          createdAt: {
            gte: currentMonthStart,
            lte: todayStartDate,
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
      console.log(thisMonthUserCount,"newmonth");
      const lastMonthUserCount = await prisma.user.count({
        where: {
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      });
      console.log(lastMonthUserCount,"oldmonth");

      
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
      // const allAttendances = await prisma.attendance.findMany({
      //   orderBy: [
      //     {
      //       id: "desc",
      //     },
      //   ],
      //   skip: Number(skip),
      //   take: Number(limit),
      //   // where: {
      //   //   inTime: {
      //   //     gte: new Date(req.query.startdate),
      //   //     lte: new Date(req.query.enddate),
      //   //   },
      //   // },
      //   include: {
      //     user: {
      //       select: {
      //         firstName: true,
      //         lastName: true,
      //     employeeId:true,

      //       },
      //     },
      //   },
      // });
      // const punchBys = await prisma.user.findMany({
      //   where: {
      //     id: { in: allAttendance.map((item) => item.punchBy) },
      //   },
      //   select: {
      //     id: true,
      //     firstName: true,
      //     lastName: true,
      //     employeeId:true,
      //   },
      // });

      const result = {
        totalPresent: presentCount,
        totalAbsent: absentCount,
        totalLeaves:leaveCount,
        totalHoliday:holidayCount,
        currentMonthUserCount: currentMonthCount,
        previousMonthUserCount: previousMonthCount,
        totalUsers:totalUsers,
        thisMonthUserCount:thisMonthUserCount,
        lastMonthUserCount:lastMonthUserCount,
        percentageChange:percentageChange,
        pendingUserCount:pendingUserCount,
        approvedUserCount:approvedUserCount,
        rejectedUserCount:rejectedUserCount,
        attendanceData:allAttendance.map((attendance) => {
          return {
            ...attendance,
            punchBy: punchBy,
          };
        })
      };
      return res.status(200).json(result);
    }else if (employeeId && createdAtFrom && createdAtTo) {
      const startDate = new Date(createdAtFrom);
      const endDate = new Date(createdAtTo);
      endDate.setHours(23, 59, 59);
    
      if (isNaN(startDate) || isNaN(endDate)) {
        return res.status(400).json({ message: "Invalid date parameters." });
      }
      
      // Find user by employeeId
      const user = await prisma.user.findUnique({
        where: {
          employeeId: employeeId,
        },
      });
    
      if (!user) {
        return res.status(404).json({ message: "User not found with the provided employeeId." });
      }
    
      attendanceQuery.where = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        userId: user.id,
      };
    
      const userAttendance = await prisma.attendance.findMany({
        ...attendanceQuery,
      });
    
      // Calculate total present leaves and absent records
      let presentCount = 0;
      let absentCount = 0;
      let leaveCount=0;
      let holidayCount=0
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
    
      const punchBy = await prisma.user.findMany({
        where: {
          id: { in: userAttendance.map((item) => item.punchBy) },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
        },
      });
      
    
      const result = {
        totalPresent: presentCount,
        totalAbsent: absentCount,
        totalLeaves:leaveCount,
        totalHoliday:holidayCount,
        totalUsers:totalUsers,
        
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
      
      // Find user by employeeId
      // const user = await prisma.user.findUnique({
      //   where: {
      //     employeeId: employeeId,
      //   },
      // });
    
      // if (!user) {
      //   return res.status(404).json({ message: "User not found with the provided employeeId." });
      // }
    
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
      let leaveCount=0;
      let holidayCount=0
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
    
      const punchBy = await prisma.user.findMany({
        where: {
          id: { in: userAttendance.map((item) => item.punchBy) },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
        },
      });
      
    
      const result = {
        totalPresent: presentCount,
        totalAbsent: absentCount,
        totalLeaves:leaveCount,
        totalHoliday:holidayCount,
        totalUsers:totalUsers,
        
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
      message:"Attendence updated successfully"
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteSingleAttendence = async (req, res) => {
  try {
      const deletedattendence= await prisma.attendance.delete({
        where: {
          id: Number(req.params.id),
        },
      });
      return res.status(200).json({
        message:"Attendence deleted Successfully"
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

    const startTime = moment(user.shift.startTime, "h:mm A");
    const endTime = moment(user.shift.endTime, "h:mm A");

    const today = moment(req.body.acceptLeaveFrom).startOf("day");
    const endDay = moment(req.body.acceptLeaveTo).startOf("day");
    // Calculate leave duration in days
    const leaveDurationDays = moment(endDay).diff(today, "days") + 1;

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
            createdAt:attendanceDate,
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
        attendanceCreationPromises
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
