const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");
//create a new employee
const createSingleLeave = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many designation at once
      const deletedLeave = await prisma.leaveApplication.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });
      return res.status(200).json(deletedLeave);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    try {
      // create single designation from an object
      const leaveFrom = new Date(req.body.leaveFrom);
      const leaveTo = new Date(req.body.leaveTo);
      const leaveDuration = Math.round(
        (leaveTo.getTime() - leaveFrom.getTime()) / (1000 * 60 * 60 * 24)
      );

      const createdLeave = await prisma.leaveApplication.create({
        data: {
          user: {
            connect: {
              id: parseInt(req.body.userId),
            },
          },
          leaveType: req.body.leaveType,
          leaveFrom: leaveFrom,
          leaveTo: leaveTo,
          leaveDuration: leaveDuration,
          reason: req.body.reason ? req.body.reason : undefined,
        },
      });

      return res.status(201).json(createdLeave);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getAllLeave = async (req, res) => {
  if (req.query.query === "all") {
    const allLeave = await prisma.leaveApplication.findMany({
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

    // get the id and acceptLeaveBy from all leave array
    const acceptLeaveBy = allLeave.map((item) => {
      return {
        ...item,
        acceptLeaveBy: item.acceptLeaveBy,
      };
    });

    // get the acceptLeaveBy from user table and return the firstName and lastName into acceptLeaveBy and if acceptLeaveBy is null then return null into acceptLeaveBy for that object
    const result = await Promise.all(
      acceptLeaveBy.map(async (item) => {
        if (item.acceptLeaveBy) {
          const acceptLeaveBy = await prisma.user.findUnique({
            where: {
              id: item.acceptLeaveBy,
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          });
          return {
            ...item,
            acceptLeaveBy: acceptLeaveBy,
          };
        } else {
          return {
            ...item,
            acceptLeaveBy: null,
          };
        }
      })
    );

    return res.status(200).json(result);
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allLeave = await prisma.leaveApplication.findMany({
        orderBy: [
          {
            id: "asc",
          },
        ],
        skip: Number(skip),
        take: Number(limit),
        where: {
          status: req.query.status,
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
      // get the id and acceptLeaveBy from all leave array
      const acceptLeaveBy = allLeave.map((item) => {
        return {
          ...item,
          acceptLeaveBy: item.acceptLeaveBy,
        };
      });

      // get the acceptLeaveBy from user table and return the firstName and lastName into acceptLeaveBy and if acceptLeaveBy is null then return null into acceptLeaveBy for that object
      const result = await Promise.all(
        acceptLeaveBy.map(async (item) => {
          if (item.acceptLeaveBy) {
            const acceptLeaveBy = await prisma.user.findUnique({
              where: {
                id: item.acceptLeaveBy,
              },
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            });
            return {
              ...item,
              acceptLeaveBy: acceptLeaveBy,
            };
          } else {
            return {
              ...item,
              acceptLeaveBy: null,
            };
          }
        })
      );

      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getSingleLeave = async (req, res) => {
  try {
    const singleLeave = await prisma.leaveApplication.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userName: true,
          },
        },
      },
    });

    if (!singleLeave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    const acceptLeaveBy = await prisma.user.findUnique({
      where: {
        id: singleLeave.id,
      },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    if (
      (req.auth.sub !== singleLeave.userId &&
        !req.auth.permissions.includes("readAll-leaveApplication")) ||
      !req.auth.permissions.includes("readSingle-leaveApplication")
    ) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = {
      ...singleLeave,
      acceptLeaveBy: acceptLeaveBy,
    };

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
const grantedLeave = async (req, res) => {
  try {
    const acceptLeaveFrom = new Date(req.body.acceptLeaveFrom);
    const acceptLeaveTo = new Date(req.body.acceptLeaveTo);
    const leaveDuration = Math.round(
      (acceptLeaveTo.getTime() - acceptLeaveFrom.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const grantedLeave = await prisma.leaveApplication.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        acceptLeaveBy: req.auth.sub,
        acceptLeaveFrom: acceptLeaveFrom ? acceptLeaveFrom : undefined,
        acceptLeaveTo: acceptLeaveTo ? acceptLeaveTo : undefined,
        leaveDuration: leaveDuration ? leaveDuration : 0,
        reviewComment: req.body.reviewComment
          ? req.body.reviewComment
          : undefined,
        status: req.body.status,
      },
    });
    return res.status(200).json(grantedLeave);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getLeaveByUserId = async (req, res) => {
  try {
    const getLeaveTo = await prisma.leaveApplication.findMany({
      where: {
        AND: {
          userId: Number(req.params.id),
          status: "ACCEPTED",
        },
      },
      orderBy: [
        {
          id: "desc",
        },
      ],
    });

    // check if the user has any leave
    const isId = getLeaveTo.map((item) => item.id);

    if (isId.length === 0)
      return res.status(200).json({ message: "No leave found for this user" });

    // check if the user is on leave
    const leaveTo = getLeaveTo[0].leaveTo;
    const currentDate = new Date();

    let leaveStatus = "";
    if (leaveTo > currentDate) leaveStatus = "on leave";
    else leaveStatus = "not on leave";

    // get all leave history
    const singleLeave = await prisma.leaveApplication.findMany({
      where: {
        AND: {
          userId: Number(req.params.id),
        },
      },
      orderBy: [
        {
          id: "desc",
        },
      ],
    });
    return res.status(200).json({ singleLeave, leaveStatus });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
module.exports = {
  createSingleLeave,
  getAllLeave,
  getSingleLeave,
  grantedLeave,
  getLeaveByUserId,
};
