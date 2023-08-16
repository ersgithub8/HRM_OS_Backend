const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

//create milestone controller
const createMilestone = async (req, res) => {
  try {
    const milestone = await prisma.milestone.create({
      data: {
        project: {
          connect: {
            id: req.body.projectId,
          },
        },
        name: req.body.name,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        description: req.body.description,
      },
    });
    return res.status(201).json(milestone);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//get all milestones controller
const getAllMilestones = async (req, res) => {
  if (req.query.query === "all") {
    const allMilestones = await prisma.milestone.findMany({
      orderBy: [
        {
          id: "desc",
        },
      ],
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
    });
    return res.status(200).json(allMilestones);
  } else if (req.query.status === "PROGRESS") {
    const { skip, limit } = getPagination(req.query);
    try {
      const allMilestones = await prisma.milestone.findMany({
        orderBy: [
          {
            id: "desc",
          },
        ],
        where: {
          status: req.query.status,
        },
        skip: Number(skip),
        take: Number(limit),
      });
      return res.status(200).json(allMilestones);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.status === "ONHOLD") {
    const { skip, limit } = getPagination(req.query);
    try {
      const allMilestones = await prisma.milestone.findMany({
        orderBy: [
          {
            id: "desc",
          },
        ],
        where: {
          status: req.query.status,
        },
        skip: Number(skip),
        take: Number(limit),
      });
      return res.status(200).json(allMilestones);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.status === "COMPLETED") {
    const { skip, limit } = getPagination(req.query);
    try {
      const allMilestones = await prisma.milestone.findMany({
        orderBy: [
          {
            id: "desc",
          },
        ],
        where: {
          status: req.query.status,
        },
        skip: Number(skip),
        take: Number(limit),
      });
      return res.status(200).json(allMilestones);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allMilestones = await prisma.milestone.findMany({
        orderBy: [
          {
            id: "desc",
          },
        ],
        where: {
          status: req.query.status,
        },
        skip: Number(skip),
        take: Number(limit),
      });
      return res.status(200).json(allMilestones);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

//get milestone by id controller

const getMilestoneById = async (req, res) => {
  try {
    const milestone = await prisma.milestone.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        project: true,
      },
    });
    return res.status(200).json(milestone);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//get milestone by project id controller
const getMilestoneByProjectId = async (req, res) => {
  try {
    const milestone = await prisma.milestone.findMany({
      where: {
        projectId: Number(req.params.id),
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
    });
    return res.status(200).json(milestone);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//update milestone controller
const updateMilestone = async (req, res) => {
  if (req.query.query === "all") {
    try {
      const milestone = await prisma.milestone.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          name: req.body.name,
          startDate: new Date(req.body.startDate),
          endDate: new Date(req.body.endDate),
          description: req.body.description,
        },
      });
      return res.status(200).json(milestone);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.query === "status") {
    try {
      const milestone = await prisma.milestone.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          status: req.body.status,
        },
      });
      return res.status(200).json(milestone);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: error.message });
    }
  }
};

//delete milestone controller
const deleteMilestone = async (req, res) => {
  try {
    const milestone = await prisma.milestone.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        status: "DELETED",
      },
    });
    return res.status(200).json(milestone);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createMilestone,
  getAllMilestones,
  getMilestoneById,
  getMilestoneByProjectId,
  updateMilestone,
  deleteMilestone,
};
