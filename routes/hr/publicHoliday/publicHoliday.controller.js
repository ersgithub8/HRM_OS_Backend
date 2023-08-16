const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

const createPublicHoliday = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many designation at once
      const deletedPublicHoliday = await prisma.publicHoliday.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });
      return res.status(200).json(deletedPublicHoliday);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.query === "createmany") {
    const createdPublicHoliday = await prisma.publicHoliday.createMany({
      data: req.body,
      skipDuplicates: true,
    });
    return res.status(201).json(createdPublicHoliday);
  } else {
    try {
      const createdPublicHoliday = await prisma.publicHoliday.create({
        data: {
          name: req.body.name,
          date: new Date(req.body.date),
        },
      });

      return res.status(201).json(createdPublicHoliday);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getAllPublicHoliday = async (req, res) => {
  if (req.query.query === "all") {
    const allPublicHoliday = await prisma.publicHoliday.findMany({
      orderBy: [
        {
          id: "asc",
        },
      ],
    });

    return res.status(200).json(allPublicHoliday);
  } else if (req.query.status === "false") {
    const { skip, limit } = getPagination(req.query);
    try {
      const allPublicHoliday = await prisma.publicHoliday.findMany({
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
      });

      return res.status(200).json(allPublicHoliday);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allPublicHoliday = await prisma.publicHoliday.findMany({
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
      });

      return res.status(200).json(allPublicHoliday);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getSinglePublicHoliday = async (req, res) => {
  try {
    const singlePublicHoliday = await prisma.publicHoliday.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });

    if (!singlePublicHoliday) {
      return res.status(404).json({ message: "public Holiday not found" });
    }

    return res.status(200).json(singlePublicHoliday);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateSinglePublicHoliday = async (req, res) => {
  try {
    const updatedPublicHoliday = await prisma.publicHoliday.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name: req.body.name,
        date: req.body.date,
      },
    });

    return res.status(200).json(updatedPublicHoliday);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteSinglePublicHoliday = async (req, res) => {
  try {
    const deletedPublicHoliday = await prisma.publicHoliday.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });

    return res.status(200).json(deletedPublicHoliday);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createPublicHoliday,
  getAllPublicHoliday,
  getSinglePublicHoliday,
  updateSinglePublicHoliday,
  deleteSinglePublicHoliday,
};
