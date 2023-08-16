const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

const createSingleAward = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many Award at once
      const deletedAward = await prisma.award.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });
      return res.status(200).json(deletedAward);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.query === "createmany") {
    try {
      // create many Award from an array of objects
      const createdAward = await prisma.award.createMany({
        data: req.body,
        skipDuplicates: true,
      });

      return res.status(201).json(createdAward);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    try {
      // create single Award from an object
      const createdAward = await prisma.award.create({
        data: {
          name: req.body.name,
          description: req.body.description,
        },
      });

      return res.status(201).json(createdAward);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getAllAward = async (req, res) => {
  if (req.query.query === "all") {
    try {
      const allAward = await prisma.award.findMany({
        orderBy: {
          id: "asc",
        },
      });
      return res.status(200).json(allAward);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.status === "false") {
    const { skip, limit } = getPagination(req.query);
    try {
      const allAward = await prisma.award.findMany({
        orderBy: {
          id: "asc",
        },
        where: {
          status: false,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
      });
      return res.status(200).json(allAward);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allAward = await prisma.award.findMany({
        orderBy: {
          id: "asc",
        },
        where: {
          status: true,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
      });
      return res.status(200).json(allAward);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getSingleAward = async (req, res) => {
  try {
    const singleAward = await prisma.award.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        awardHistory: {
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
        },
      },
    });

    const userId = [];
    singleAward.awardHistory.forEach((item) => {
      userId.push(item.userId);
    });

    if (
      (req.auth.sub !== userId[0] &&
        !req.auth.permissions.includes("readAll-award")) ||
      !req.auth.permissions.includes("readSingle-award")
    ) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.status(200).json(singleAward);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateSingleAward = async (req, res) => {
  try {
    const updatedAward = await prisma.award.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name: req.body.name,
        description: req.body.description,
      },
    });

    return res.status(200).json(updatedAward);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteSingleAward = async (req, res) => {
  try {
    const deletedAward = await prisma.award.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        status: req.body.status,
      },
    });

    return res.status(200).json(deletedAward);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createSingleAward,
  getAllAward,
  getSingleAward,
  updateSingleAward,
  deleteSingleAward,
};
