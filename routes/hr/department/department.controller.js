const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

//create a new employee
const createSingleDepartment = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many designation at once
      const deletedDepartment = await prisma.department.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });
      return res.status(200).json(deletedDepartment);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.query === "createmany") {
    try {
      // create many designation from an array of objects
      const createdDepartment = await prisma.department.createMany({
        data: req.body,
        skipDuplicates: true,
      });
      return res.status(201).json(createdDepartment);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    try {
      const createdDepartment = await prisma.department.create({
        data: {
          name: req.body.name,
        },
      });

      return res.status(201).json(createdDepartment);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getAllDepartment = async (req, res) => {
  if (req.query.query === "all") {
    const allDepartment = await prisma.department.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userName: true,
            role: {
              select: {
                name: true,
                id: true,
              },
            },
            designationHistory: {
              orderBy: [
                {
                  id: "desc",
                },
              ],
              take: 1,

              select: {
                designation: {
                  select: {
                    name: true,
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        {
          id: "desc",
        },
      ],
    });
    return res.status(200).json(allDepartment);
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allDepartment = await prisma.department.findMany({
        orderBy: [
          {
            id: "desc",
          },
        ],
        skip: Number(skip),
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userName: true,
              role: {
                select: {
                  name: true,
                  id: true,
                },
              },
              designationHistory: {
                orderBy: [
                  {
                    id: "desc",
                  },
                ],
                take: 1,

                select: {
                  designation: {
                    select: {
                      name: true,
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      return res.status(200).json(allDepartment);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getSingleDepartment = async (req, res) => {
  try {
    const singleDepartment = await prisma.department.findUnique({
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
            role: {
              select: {
                name: true,
                id: true,
              },
            },
            designationHistory: {
              orderBy: [
                {
                  id: "desc",
                },
              ],
              take: 1,

              select: {
                designation: {
                  select: {
                    name: true,
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    const userId = [];
    singleDepartment.user.map((user) => {
      userId.push(user.id);
    });
    if (
      (req.auth.sub !== userId[0] &&
        !req.auth.permissions.includes("readAll-department")) ||
      !req.auth.permissions.includes("readSingle-department")
    ) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.status(200).json(singleDepartment);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateSingleDepartment = async (req, res) => {
  try {
    const updatedDepartment = await prisma.department.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        name: req.body.name,
      },
    });
    return res.status(200).json(updatedDepartment);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// const deletedDepartment = async (req, res) => {
//   try {
//     const deletedDepartment = await prisma.department.update({
//       where: {
//         id: Number(req.params.id),
//       },
//       data: {
//         status: req.body.status,
//       },
//     });
//     return res.status(200).json(deletedDepartment);
//   } catch (error) {
//     return res.status(400).json({ message: error.message });
//   }
// };

const deletedDepartment = async (req, res) => {
  const departmentId = parseInt(req.params.id);

  try {
    
    const usersWithDepartment = await prisma.user.findMany({
      where: {
        departmentId: departmentId,
      },
      select: {
        employeeId: true,
      },
    });

    if (usersWithDepartment.length > 0) {
      const userIDsWithDepartment = usersWithDepartment.map((user) => user.employeeId);

      return res.status(400).json({
        message: "Cannot delete role. It is still assigned to some users.",
        usersDepartment: userIDsWithDepartment,
      });
    }

    const deletedDepartment = await prisma.department.delete({
      where: {
        id: departmentId,
      },
    });

    if (!deletedDepartment) {
      return res.status(404).json({ message: "Department delete failed" });
    }

    return res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


module.exports = {
  createSingleDepartment,
  getAllDepartment,
  getSingleDepartment,
  updateSingleDepartment,
  deletedDepartment,
};
