const { getPagination } = require("../../../utils/query");
const moment = require("moment");
const prisma = require("../../../utils/prisma");

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

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: id,
        outTime: null,
      },
    });

    if (req.query.query === "manualPunch") {
      const inTime = new Date(req.body.inTime);
      const outTime = new Date(req.body.outTime);

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
          ip: req.body.ip ? req.body.ip : null,
          totalHour: parseFloat(totalHours.toFixed(3)),
        },
      });
      return res.status(201).json(newAttendance);
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
          inTimeStatus: isEarly ? "Early" : isLate ? "Late" : "On Time",
          outTimeStatus: null,
        },
      });
      return res.status(201).json(newAttendance);
    } else {
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
      return res.status(200).json(newAttendance);
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

const getAttendanceByUserId = async (req, res) => {
  try {
    const allAttendance = await prisma.attendance.findMany({
      where: {
        userId: parseInt(req.params.id),
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

module.exports = {
  createAttendance,
  getAllAttendance,
  getSingleAttendance,
  getAttendanceByUserId,
  getLastAttendanceByUserId,
};
