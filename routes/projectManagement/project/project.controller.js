const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

//create project controller
const createProject = async (req, res) => {
  try {
    const project = await prisma.project.create({
      data: {
        projectManager: {
          connect: {
            id: Number(req.body.projectManagerId),
          },
        },
        name: req.body.name,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        description: req.body.description,
      },
    });

    await prisma.taskStatus.createMany({
      data: [
        {
          name: "TODO",
          projectId: project.id,
        },
        {
          name: "IN PROGRESS",
          projectId: project.id,
        },
        {
          name: "DONE",
          projectId: project.id,
        },
      ],
      skipDuplicates: true,
    });
    return res.status(201).json({ project });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//get all projects controller
const getAllProjects = async (req, res) => {
  if (req.query.query === "all") {
    const allProjects = await prisma.project.findMany({
      orderBy: [
        {
          id: "desc",
        },
      ],
      include: {
        projectManager: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    return res.status(200).json(allProjects);
  } else if (req.query.status === "PROGRESS") {
    const { skip, limit } = getPagination(req.query);
    try {
      const allProjects = await prisma.project.findMany({
        orderBy: [
          {
            id: "desc",
          },
        ],
        include: {
          projectManager: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        where: {
          status: req.query.status,
        },
        skip: Number(skip),
        take: Number(limit),
      });
      return res.status(200).json(allProjects);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.status === "ONHOLD") {
    const { skip, limit } = getPagination(req.query);
    try {
      const allProjects = await prisma.project.findMany({
        orderBy: [
          {
            id: "desc",
          },
        ],
        include: {
          projectManager: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        where: {
          status: req.query.status,
        },
        skip: Number(skip),
        take: Number(limit),
      });
      return res.status(200).json(allProjects);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.status === "COMPLETED") {
    const { skip, limit } = getPagination(req.query);
    try {
      const allProjects = await prisma.project.findMany({
        orderBy: [
          {
            id: "desc",
          },
        ],
        include: {
          projectManager: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        where: {
          status: req.query.status,
        },
        skip: Number(skip),
        take: Number(limit),
      });
      return res.status(200).json(allProjects);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allProjects = await prisma.project.findMany({
        orderBy: [
          {
            id: "desc",
          },
        ],
        include: {
          projectManager: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        where: {
          status: req.query.status,
        },
        skip: Number(skip),
        take: Number(limit),
      });
      return res.status(200).json(allProjects);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

//get project by id controller
const getProjectById = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        milestone: true,
        projectTeam: {
          include: {
            projectTeamMember: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        task: {
          include: {
            taskStatus: true,
          },
        },
      },
    });
    return res.status(200).json(project);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//update project controller
const updateProject = async (req, res) => {
  try {
    const project = await prisma.project.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        projectManager: {
          connect: {
            id: Number(req.body.projectManagerId),
          },
        },
        name: req.body.name,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        description: req.body.description,
        status: req.body.status,
      },
    });
    return res.status(200).json(project);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//delete project controller
const deleteProject = async (req, res) => {
  try {
    const project = await prisma.project.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        status: "DELETED",
      },
    });
    return res.status(200).json(project);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
