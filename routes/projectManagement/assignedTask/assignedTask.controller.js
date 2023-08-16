const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

//create assignedTask controller
const createAssignedTask = async (req, res) => {
  try {
    const assignedTask = await prisma.assignedTask.create({
      data: {
        task: {
          connect: {
            id: parseInt(req.body.taskId),
          },
        },
        projectTeam: {
          connect: {
            id: parseInt(req.body.projectTeamId),
          },
        },
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      },
    });
    return res.status(201).json(assignedTask);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//get all assignedTask controller
const getAllAssignedTask = async (req, res) => {
  if (req.query.query === "all") {
    try {
      const assignedTask = await prisma.assignedTask.findMany({
        orderBy: [
          {
            id: "desc",
          },
        ],
      });
      return res.status(200).json(assignedTask);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

//get assignedTask by id controller
const getAssignedTaskById = async (req, res) => {
  try {
    const assignedTask = await prisma.assignedTask.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        projectTeam: {
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        task: true,
      },
    });
    return res.status(200).json(assignedTask);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
};

//update assignedTask controller
const updateAssignedTask = async (req, res) => {
  try {
    const assignedTask = await prisma.assignedTask.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        task: {
          connect: {
            id: parseInt(req.body.taskId),
          },
        },
        projectTeam: {
          connect: {
            id: parseInt(req.body.projectTeamId),
          },
        },
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      },
    });
    return res.status(200).json(assignedTask);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//delete assignedTask controller
const deleteAssignedTask = async (req, res) => {
  try {
    const assignedTask = await prisma.assignedTask.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        status: false,
      },
    });
    return res.status(200).json(assignedTask);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createAssignedTask,
  getAllAssignedTask,
  getAssignedTaskById,
  updateAssignedTask,
  deleteAssignedTask,
};
