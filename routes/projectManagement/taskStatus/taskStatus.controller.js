const prisma = require("../../../utils/prisma");

//create taskStatus controller. This controller will create a new taskStatus in the database and return the created taskStatus. here is only one column in the taskStatus table which is name.
const createTaskStatus = async (req, res) => {
  try {
    const taskStatus = await prisma.taskStatus.create({
      data: {
        projectId: req.body.projectId,
        name: req.body.name,
      },
    });
    return res.status(201).json(taskStatus);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//get all taskStatus controller. This controller will return all taskStatus in the database.
const getAllTaskStatus = async (req, res) => {
  if (req.query.query === "all") {
    try {
      const taskStatus = await prisma.taskStatus.findMany({
        orderBy: [
          {
            id: "asc",
          },
        ],
      });
      return res.status(200).json(taskStatus);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.status === "true") {
    try {
      const taskStatus = await prisma.taskStatus.findMany({
        orderBy: [
          {
            id: "asc",
          },
        ],
        where: {
          status: true,
        },
      });
      return res.status(200).json(taskStatus);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.status === "false") {
    try {
      const taskStatus = await prisma.taskStatus.findMany({
        orderBy: [
          {
            id: "asc",
          },
        ],
        where: {
          status: false,
        },
      });
      return res.status(200).json(taskStatus);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

//get taskStatus by id controller. This controller will return a taskStatus by id.
const getTaskStatusById = async (req, res) => {
  try {
    const taskStatus = await prisma.taskStatus.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        task: true,
      },
    });
    return res.status(200).json(taskStatus);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//get taskStatus by projectId controller. This controller will return a taskStatus by projectId.
const getTaskStatusByProjectId = async (req, res) => {
  try {
    const taskStatus = await prisma.taskStatus.findMany({
      where: {
        projectId: parseInt(req.params.id),
      },
      include: {
        project: {
          select: {
            milestone: {
              select: {
                name: true,
              },
            },
          },
        },
        task: {
          include: {
            priority: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    return res.status(200).json(taskStatus);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//update taskStatus controller. This controller will update a taskStatus by id and return the updated taskStatus.
const updateTaskStatus = async (req, res) => {
  try {
    const taskStatus = await prisma.taskStatus.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        projectId: req.body.projectId,
        name: req.body.name,
      },
    });
    if (!taskStatus) {
      return res.status(400).json({ message: "task status not update" });
    }
    return res.status(200).json(taskStatus);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//delete taskStatus controller. This controller will delete a taskStatus by id.
const deleteTaskStatus = async (req, res) => {
  try {
    const taskStatus = await prisma.taskStatus.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });
    return res.status(200).json(taskStatus);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTaskStatus,
  getAllTaskStatus,
  getTaskStatusById,
  getTaskStatusByProjectId,
  updateTaskStatus,
  deleteTaskStatus,
};
