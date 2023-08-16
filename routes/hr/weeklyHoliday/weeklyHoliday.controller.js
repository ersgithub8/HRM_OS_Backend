const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

const createSingleWeeklyHoliday = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many designation at once
      const deletedWeeklyHoliday = await prisma.weeklyHoliday.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });
      return res.status(200).json(deletedWeeklyHoliday);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.query === "createmany") {
    const createdWeeklyHoliday = await prisma.weeklyHoliday.createMany({
      data: req.body,
      skipDuplicates: true,
    });
    return res.status(201).json(createdWeeklyHoliday);
  } else {
    try {
      const createdWeeklyHoliday = await prisma.weeklyHoliday.create({
        data: {
          name: req.body.name,
          startDay: req.body.startDay,
          endDay: req.body.endDay,
        },
      });

      return res.status(201).json(createdWeeklyHoliday);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getAllWeeklyHoliday = async (req, res) => {
  if (req.query.query === "all") {
    const allWeeklyHoliday = await prisma.weeklyHoliday.findMany({
      orderBy: [
        {
          id: "asc",
        },
      ],
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

    return res.status(200).json(allWeeklyHoliday);
  } else if (req.query.status === "false") {
    const { skip, limit } = getPagination(req.query);
    try {
      const allWeeklyHoliday = await prisma.weeklyHoliday.findMany({
        orderBy: [
          {
            id: "asc",
          },
        ],
        where: {
          status: false,
        },
        skip: Number(skip),
        take: Number(limit),
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

      return res.status(200).json(allWeeklyHoliday);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allWeeklyHoliday = await prisma.weeklyHoliday.findMany({
        orderBy: [
          {
            id: "asc",
          },
        ],
        where: {
          status: true,
        },
        skip: Number(skip),
        take: Number(limit),
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

      return res.status(200).json(allWeeklyHoliday);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getSingleWeeklyHoliday = async (req, res) => {
  try {
    const singleWeeklyHoliday = await prisma.weeklyHoliday.findUnique({
      where: {
        id: parseInt(req.params.id),
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

    if (!singleWeeklyHoliday) {
      return res.status(404).json({ message: "Weekly Holiday not found" });
    }

    return res.status(200).json(singleWeeklyHoliday);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateSingleWeeklyHoliday = async (req, res) => {
  try {
    const updatedWeeklyHoliday = await prisma.weeklyHoliday.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name: req.body.name,
        startDay: req.body.startDay,
        endDay: req.body.endDay,
      },
    });

    return res.status(200).json(updatedWeeklyHoliday);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteSingleWeeklyHoliday = async (req, res) => {
  try {
    const deletedWeeklyHoliday = await prisma.weeklyHoliday.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });

    return res.status(200).json(deletedWeeklyHoliday);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createSingleWeeklyHoliday,
  getAllWeeklyHoliday,
  getSingleWeeklyHoliday,
  updateSingleWeeklyHoliday,
  deleteSingleWeeklyHoliday,
};
