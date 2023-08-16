const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

//create a new employee
const createSingleEmployment = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many designation at once
      const deletedEmployment = await prisma.employmentStatus.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });
      return res.status(200).json(deletedEmployment);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.query === "createmany") {
    try {
      // create many designation from an array of objects
      const createdEmployment = await prisma.employmentStatus.createMany({
        data: req.body,
        skipDuplicates: true,
      });
      return res.status(201).json(createdEmployment);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    try {
      // create single designation from an object

      const createdEmployment = await prisma.employmentStatus.create({
        data: {
          name: req.body.name,
          colourValue: req.body.colourValue,
          description: req.body.description,
        },
      });

      return res.status(201).json(createdEmployment);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getAllEmployment = async (req, res) => {
  if (req.query.query === "all") {
    const allEmployment = await prisma.employmentStatus.findMany({
      orderBy: [
        {
          id: "asc",
        },
      ],
    });
    return res.status(200).json(allEmployment);
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allEmployment = await prisma.employmentStatus.findMany({
        orderBy: [
          {
            id: "asc",
          },
        ],
        skip: Number(skip),
        take: Number(limit),
      });
      return res.status(200).json(allEmployment);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getSingleEmployment = async (req, res) => {
  try {
    const singleEmployment = await prisma.employmentStatus.findUnique({
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
    return res.status(200).json(singleEmployment);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deletedEmployment = async (req, res) => {
  try {
    const deletedEmployment = await prisma.employmentStatus.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        status: req.body.status,
      },
    });
    return res.status(200).json(deletedEmployment);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createSingleEmployment,
  getAllEmployment,
  getSingleEmployment,
  deletedEmployment,
};
