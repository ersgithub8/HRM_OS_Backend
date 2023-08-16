const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

//create projectTeam controller
const createProjectTeam = async (req, res) => {
  try {
    const projectTeam = await prisma.projectTeam.create({
      data: {
        projectTeamName: req.body.projectTeamName,
        project: {
          connect: {
            id: Number(req.body.projectId),
          },
        },
        projectTeamMember: {
          create: req.body.projectTeamMember
            ? req.body.projectTeamMember.map((userId) => ({
                user: {
                  connect: {
                    id: Number(userId),
                  },
                },
              }))
            : undefined,
        },
      },
    });
    return res.status(201).json(projectTeam);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//get all projectTeam controller
const getAllProjectTeam = async (req, res) => {
  if (req.query.query === "all") {
    try {
      const projectTeam = await prisma.projectTeam.findMany({
        orderBy: [
          {
            id: "asc",
          },
        ],
      });
      return res.status(200).json(projectTeam);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.status === "true") {
    try {
      const projectTeam = await prisma.projectTeam.findMany({
        orderBy: [
          {
            id: "asc",
          },
        ],
        where: {
          status: true,
        },
      });
      return res.status(200).json(projectTeam);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.status === "false") {
    try {
      const projectTeam = await prisma.projectTeam.findMany({
        orderBy: [
          {
            id: "asc",
          },
        ],
        where: {
          status: false,
        },
      });
      return res.status(200).json(projectTeam);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

//get projectTeam by id controller
const getProjectTeamById = async (req, res) => {
  try {
    const projectTeam = await prisma.projectTeam.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        project: {
          select: {
            id: true,
            projectManager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            name: true,
          },
        },
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
    });
    return res.status(200).json(projectTeam);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//get projectTeam by project id controller
const getProjectTeamByProjectId = async (req, res) => {
  try {
    const projectTeam = await prisma.projectTeam.findMany({
      where: {
        projectId: parseInt(req.params.id),
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        projectTeamMember: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
    return res.status(200).json(projectTeam);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//update projectTeam controller
const updateProjectTeam = async (req, res) => {
  if (req.query.query === "all") {
    try {
      const projectTeam = await prisma.projectTeam.update({
        where: {
          id: parseInt(req.params.id),
        },
        data: {
          projectTeamName: req.body.projectTeamName,
          project: {
            connect: {
              id: parseInt(req.body.projectId),
            },
          },
          projectTeamMember: {
            create: req.body.projectTeamMember
              ? req.body.projectTeamMember.map((userId) => ({
                  user: {
                    connect: {
                      id: Number(userId),
                    },
                  },
                }))
              : undefined,
          },
        },
      });
      return res.status(200).json(projectTeam);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    try {
      const projectTeam = await prisma.projectTeam.update({
        where: {
          id: parseInt(req.params.id),
        },
        data: {
          status: req.body.status,
        },
      });
      return res.status(200).json(projectTeam);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

//delete projectTeam controller
const deleteProjectTeam = async (req, res) => {
  try {
    const projectTeam = await prisma.projectTeam.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        status: req.body.status,
      },
    });
    return res.status(200).json(projectTeam);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createProjectTeam,
  getAllProjectTeam,
  getProjectTeamById,
  getProjectTeamByProjectId,
  updateProjectTeam,
  deleteProjectTeam,
};
