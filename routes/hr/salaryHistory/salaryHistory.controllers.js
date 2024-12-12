const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

const createSingleSalaryHistory = async (req, res) => {
  try {
    if (req.query.query === "deletemany") {
      const deletedSalaryHistory = await prisma.salaryHistory.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });
      res.json(deletedSalaryHistory);
    } else if (req.query.query === "createmany") {
      const createdSalaryHistory = await prisma.salaryHistory.createMany({
        data: req.body,
      });
      return res.status(200).json(createdSalaryHistory);
    } else {
      const createdSalaryHistory = await prisma.salaryHistory.create({
        data: {
          userId: req.body.userId,
          salary: req.body.salary,
          startDate: new Date(req.body.salaryStartDate).toISOString(), // Ensure this is a valid date string
          endDate: req.body.salaryEndDate ? new Date(req.body.salaryEndDate).toISOString() : null, // Check and convert if not null
          comment: req.body.salaryComment,
        },
      });
      return res.status(200).json(createdSalaryHistory);
    }
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

const getAllSalaryHistory = async (req, res) => {
  if (req.query.query === "all") {
    const allSalaryHistory = await prisma.salaryHistory.findMany({
      orderBy: [
        {
          id: "desc",
        },
      ],
    });
    return res.status(200).json(allSalaryHistory);
  } else if (req.query.status === "false") {
    try {
      const { skip, limit } = getPagination(req.query);
      const allSalaryHistory = await prisma.salaryHistory.findMany({
        where: {
          status: false,
        },
        orderBy: [
          {
            id: "desc",
          },
        ],
        skip: Number(skip),
        take: Number(limit),
      });
      return res.status(200).json(allSalaryHistory);
    } catch (error) {
      return res.status(400).json(error.message);
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allSalaryHistory = await prisma.salaryHistory.findMany({
        where: {
          status: true,
        },
        orderBy: [
          {
            id: "desc",
          },
        ],
        skip: Number(skip),
        take: Number(limit),
      });
      return res.status(200).json(allSalaryHistory);
    } catch (error) {
      return res.status(400).json(error.message);
    }
  }
};

const getSingleSalaryHistory = async (req, res) => {
  try {
    const singleSalaryHistory = await prisma.salaryHistory.findUnique({
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
            email: true,
          },
        },
      },
    });
    res.json(singleSalaryHistory);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

const updateSingleSalaryHistory = async (req, res) => {
  try {
    if (req.query.query === "status") {
      const updatedSalaryHistory = await prisma.salaryHistory.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          status: req.body.status,
        },
      });
      return res.status(200).json(updatedSalaryHistory);
    }else {
      // Function to validate the date
      const isValidDate = (dateString) => {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
      };
    
      // Check if provided dates are valid
      if (!isValidDate(req.body.salaryStartDate) || (req.body.salaryEndDate && !isValidDate(req.body.salaryEndDate))) {
        return res.status(400).json({ message: 'Invalid date format provided.' });
      }
    
      const updatedSalaryHistory = await prisma.salaryHistory.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          salary: req.body.salary,
          startDate: new Date(req.body.salaryStartDate).toISOString(), // Convert to ISO string format
          endDate: req.body.salaryEndDate ? new Date(req.body.salaryEndDate).toISOString() : null, // Convert if not null
          comment: req.body.salaryComment,
        },
      });
      return res.status(200).json(updatedSalaryHistory);
    }

  } catch (error) {
    return res.status(400).json(error.message);
  }
};

const deleteSingleSalaryHistory = async (req, res) => {
  try {
    const deletedSalaryHistory = await prisma.salaryHistory.delete({
      where: {
        id: Number(req.params.id),
      },
    });
    res.status(200).json(deletedSalaryHistory);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

module.exports = {
  createSingleSalaryHistory,
  getAllSalaryHistory,
  getSingleSalaryHistory,
  updateSingleSalaryHistory,
  deleteSingleSalaryHistory,
};
