const { getPagination } = require("../../../utils/query");
const moment = require("moment");
const prisma = require("../../../utils/prisma");
const { Op } = require("sequelize"); // Assuming you're using Sequelize for PostgreSQL

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

    // format time
    const startTime = moment(user.shift.startTime, "h:mm A");
    const endTime = moment(user.shift.endTime, "h:mm A");

    // check if user is late or early
    const isLate = moment().isAfter(startTime);
    const isEarly = moment().isBefore(startTime);
    const isOutEarly = moment().isAfter(endTime);
    const isOutLate = moment().isBefore(endTime);
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

      const totalHours = Math.abs(outTime - inTime) / 36e5;

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
          attendenceStatus:req.body.attendenceStatus ? req.body.attendenceStatus:"Present",
          ip: req.body.ip ? req.body.ip : null,
          totalHour: parseFloat(totalHours.toFixed(3)),
        },
      });
      return res.status(201).json({
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
          attendenceStatus: req.body.attendenceStatus ? req.body.attendenceStatus:"Present",
          inTimeStatus: isEarly ? "Early" : isLate ? "Late" : "On Time",
          outTimeStatus: null,
        },
      });
      return res.status(201).json({
        newAttendance,
        message:"Clock in Successfully"
      });
    } else  {
      const outTime = new Date(moment.now());
      const totalHours = Math.abs(outTime - attendance.inTime) / 36e5;

      const newAttendance = await prisma.attendance.update({
        where: {
          id: attendance.id,
        },
        data: {
          outTime: outTime,
          totalHour: parseFloat(totalHours.toFixed(3)),
          outTimeStatus: isOutEarly ? "Early" : isOutLate ? "Late" : "On Time",
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


// const createAttendance = async (req, res) => {
//   try {
//     const id = parseInt(req.body.userId);
//     if (
//       !(id === req.auth.sub) &&
//       !req.auth.permissions.includes("create-attendance")
//     ) {
//       return res.status(401).json({
//         message: "Unauthorized. You are not authorized to give attendance",
//       });
//     }
//     // get user shift
//     const user = await prisma.user.findUnique({
//       where: {
//         id: id,
//       },
//       include: {
//         shift: true,
//       },
//     });

//     // format time
//     const startTime = moment(user.shift.startTime, "h:mm A");
//     const endTime = moment(user.shift.endTime, "h:mm A");

//     // check if user is late or early
//     const isLate = moment().isAfter(startTime);
//     const isEarly = moment().isBefore(startTime);
//     const isOutEarly = moment().isAfter(endTime);
//     const isOutLate = moment().isBefore(endTime);

//     const attendance = await prisma.attendance.findFirst({
//       where: {
//         userId: id,
//         outTime: null,
//       },
//     });

//     // Get the user's location data from the request
//     const userLatitude = parseFloat(req.body.latitude);
//     const userLongitude = parseFloat(req.body.longitude);

//     // Get the stored location from the database
//     const storedLocation = await prisma.location.findFirst();

//     if (!storedLocation) {
//       return res.status(404).json({ message: "Location not found." });
//     }

//     const storedLatitude = parseFloat(storedLocation.latitude);
//     const storedLongitude = parseFloat(storedLocation.longitude);

//     // Calculate the distance between user's location and stored location
//     const distanceInMeters = calculateDistance(userLatitude, userLongitude, storedLatitude, storedLongitude);

//     // Set the threshold for attendance creation (e.g., 100 meters)
//     const attendanceThreshold = 100; // You can adjust this value as needed

//     if (distanceInMeters <= attendanceThreshold) {
//       if (req.query.query === "manualPunch") {
//         const inTime = new Date(req.body.inTime);
//         const outTime = new Date(req.body.outTime);
  
//         const totalHours = Math.abs(outTime - inTime) / 36e5;
  
//         const newAttendance = await prisma.attendance.create({
//           data: {
//             userId: id,
//             inTime: inTime,
//             outTime: outTime,
//             punchBy: req.auth.sub,
//             inTimeStatus: req.body.inTimeStatus ? req.body.inTimeStatus : null,
//             outTimeStatus: req.body.outTimeStatus ? req.body.outTimeStatus : null,
//             comment: req.body.comment ? req.body.comment : null,
//             ip: req.body.ip ? req.body.ip : null,
//             totalHour: parseFloat(totalHours.toFixed(3)),
//           },
//         });
//         return res.status(201).json(newAttendance);
//       } else if (attendance === null) {
//         const inTime = new Date(moment.now());
//         const newAttendance = await prisma.attendance.create({
//           data: {
//             userId: id,
//             inTime: inTime,
//             outTime: null,
//             punchBy: req.auth.sub,
//             comment: req.body.comment ? req.body.comment : null,
//             ip: req.body.ip ? req.body.ip : null,
//             inTimeStatus: isEarly ? "Early" : isLate ? "Late" : "On Time",
//             outTimeStatus: null,
//           },
//         });
//         return res.status(201).json(newAttendance);
//       } else {
//         const outTime = new Date(moment.now());
//         const totalHours = Math.abs(outTime - attendance.inTime) / 36e5;
  
//         const newAttendance = await prisma.attendance.update({
//           where: {
//             id: attendance.id,
//           },
//           data: {
//             outTime: outTime,
//             totalHour: parseFloat(totalHours.toFixed(3)),
//             outTimeStatus: isOutEarly ? "Early" : isOutLate ? "Late" : "On Time",
//           },
//         });
//         return res.status(200).json(newAttendance);
//       }
//     } else {
//       return res.status(400).json({ message: "User is not within attendance range." });
//     }
//   } catch (error) {
//     return res.status(400).json({ message: error.message });
//   }
// };

// // // Function to calculate distance between two points using Haversine formula
// function calculateDistance(lat1, lon1, lat2, lon2) {
//   const R = 6371e3; // Earth's radius in meters
//   const phi1 = lat1 * (Math.PI / 180);
//   const phi2 = lat2 * (Math.PI / 180);
//   const deltaPhi = (lat2 - lat1) * (Math.PI / 180);
//   const deltaLambda = (lon2 - lon1) * (Math.PI / 180);

//   const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
//             Math.cos(phi1) * Math.cos(phi2) *
//             Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//   const distance = R * c;
//   return distance;
// }

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
          id: "asc",
        },
      ],
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
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
            id: "asc",
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
    const userId = parseInt(req.params.id);
    const allAttendance = await prisma.attendance.findMany({
      where: {
        userId: userId,
      },
      orderBy: [
        {
          id: "asc",
        },
      ],
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
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
      },
    });

    // Calculate total present, total leave, and total absent
    let totalPresent = 0;
    let totalLeave = 0;
    let totalAbsent = 0;

    allAttendance.forEach((attendance) => {
      if (attendance.attendenceStatus === "Present") {
        totalPresent++;
      } else if (attendance.attendenceStatus === "Leave") {
        totalLeave++;
      } else if (attendance.attendenceStatus === "Absent") {
        totalAbsent++;
      }
    });

    const result = {
      attendanceData: allAttendance.map((attendance) => {
        return {
          ...attendance,
          punchBy: punchBy,
        };
      }),
      totaldays: {
        totalPresent: totalPresent,
        totalLeave: totalLeave,
        totalAbsent: totalAbsent,
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


const search = async (req, res) => {
  const { skip, limit } = getPagination(req.query);

  try {
    const whereCondition = {};

    if (req.query.query !== "all") {
      if (req.query.inTime) {
        const startDate = new Date(req.query.inTime);
        if (!isNaN(startDate)) {
          whereCondition.inTime = {
            gte: startDate.toISOString(),
          };
        } else {
          return res.status(400).json({ message: "Invalid inTime format." });
        }
      }

      if (req.query.outTime) {
        const endDate = new Date(req.query.outTime);
        if (!isNaN(endDate)) {
          endDate.setUTCHours(23, 59, 59, 999);
          whereCondition.outTime = {
            lte: endDate.toISOString(),
          };
        } else {
          return res.status(400).json({ message: "Invalid outTime format." });
        }
      }

      if (req.query.firstName) {
        whereCondition.user = {
          firstName: {
            contains: req.query.firstName,
            mode: "insensitive",
          },
        };
      }
    }

    const allAttendance = await prisma.attendance.findMany({
      orderBy: [{ id: "asc" }],
      skip: Number(skip),
      take: Number(limit),
      where: whereCondition,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
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
};





// const search = async (req, res) => {
//   const { skip, limit } = getPagination(req.query);

//   try {
//     const whereCondition = {};

//     if (req.query.inTime) {
//       const startDate = new Date(req.query.inTime);
//       if (!isNaN(startDate)) {
//         whereCondition.inTime = {
//           gte: startDate.toISOString(),
//         };
//       } else {
//         return res.status(400).json({ message: "Invalid inTime format." });
//       }
//     }

//     if (req.query.outTime) {
//       const endDate = new Date(req.query.outTime);
//       if (!isNaN(endDate)) {
//         endDate.setUTCHours(23, 59, 59, 999);
//         whereCondition.outTime = {
//           lte: endDate.toISOString(),
//         };
//       } else {
//         return res.status(400).json({ message: "Invalid outTime format." });
//       }
//     }

//     const allAttendance = await prisma.attendance.findMany({
//       orderBy: [{ id: "asc" }],
//       skip: Number(skip),
//       take: Number(limit),
//       where: whereCondition,
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












//attendence search by date  

module.exports = {
  createAttendance,
  getAllAttendance,
  getSingleAttendance,
  getAttendanceByUserId,
  getLastAttendanceByUserId,
  search,
  updateSingleAttendence,
  deleteSingleAttendence,
};
