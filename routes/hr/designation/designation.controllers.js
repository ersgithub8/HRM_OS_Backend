const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

const createSingleDesignation = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many designation at once
      const deletedDesignation = await prisma.designation.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });

      if (!deletedDesignation) {
        return res.status(404).json({ message: "Designation not deleted" });
      }
      return res.status(200).json(deletedDesignation);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.query === "createmany") {
    try {
      // create many designation from an array of objects
      const createdDesignation = await prisma.designation.createMany({
        data: req.body,
        skipDuplicates: true,
      });

      if (!createdDesignation) {
        return res.status(404).json({ message: "Designation not created" });
      }
      return res.status(201).json(createdDesignation);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    try {
      // create single designation from an object
      const createdDesignation = await prisma.designation.create({
        data: {
          name: req.body.name,
        },
      });

      if (!createdDesignation) {
        return res.status(404).json({ message: "Designation not created" });
      }
      return res.status(201).json(createdDesignation);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getAllDesignation = async (req, res) => {
  if (req.query.query === "all") {
    try {
      // get all designation
      const allDesignation = await prisma.designation.findMany({
        orderBy: {
          id: "asc",
        },
      });
      return res.status(200).json(allDesignation);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      // get all designation paginated
      const allDesignation = await prisma.designation.findMany({
        orderBy: {
          id: "asc",
        },
        skip: parseInt(skip),
        take: parseInt(limit),
      });
      return res.status(200).json(allDesignation);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getSingleDesignation = async (req, res) => {
  try {
    const singleDesignation = await prisma.designation.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        designationHistory: {
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
      },
    });

    if (!singleDesignation) {
      return res.status(404).json({ message: "Designation not found" });
    }
    return res.status(200).json(singleDesignation);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateSingleDesignation = async (req, res) => {
  try {
    const updatedDesignation = await prisma.designation.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name: req.body.name,
      },
    });

    if (!updatedDesignation) {
      return res.status(404).json({ message: "Designation not updated" });
    }
    return res.status(200).json(updatedDesignation);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//allDesignationWiseEmployee is a function that returns all the employees with their designation
const allDesignationWiseEmployee = async (req, res) => {
  try {
    const designationWiseEmployee = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        designationHistory: {
          select: {
            designation: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            id: "desc",
          },
          take: 1,
        },
      },
    });

    const data = designationWiseEmployee.map((item) => {
      return {
        designationId: item.designationHistory[0].designation.id,
        designationName: item.designationHistory[0].designation.name,
        employee: [
          {
            id: item.id,
            firstName: item.firstName,
            lastName: item.lastName,
          },
        ],
      };
    });

    const result = data.reduce((acc, current) => {
      const x = acc.find(
        (item) => item.designationId === current.designationId
      );
      if (!x) {
        return acc.concat([current]);
      } else {
        x.employee = x.employee.concat(current.employee);
        return acc;
      }
    }, []);

    // get all designation and map it with the result
    const allDesignation = await prisma.designation.findMany({
      orderBy: {
        id: "asc",
      },
    });

    const finalResult = allDesignation.map((item) => {
      const x = result.find((i) => i.designationId === item.id);
      if (!x) {
        return {
          designationId: item.id,
          designationName: item.name,
          employee: [],
        };
      } else {
        return x;
      }
    });

    return res.status(200).json(finalResult);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const singleDesignationWiseEmployee = async (req, res) => {
  try {
    const designationWiseEmployee = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        designationHistory: {
          select: {
            designation: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            id: "desc",
          },
          take: 1,
        },
      },
    });

    const data = designationWiseEmployee.map((item) => {
      return {
        designationId: item.designationHistory[0].designation.id,
        designationName: item.designationHistory[0].designation.name,
        employee: [
          {
            id: item.id,
            firstName: item.firstName,
            lastName: item.lastName,
          },
        ],
      };
    });

    const result = data.reduce((acc, current) => {
      const x = acc.find(
        (item) => item.designationId === current.designationId
      );
      if (!x) {
        return acc.concat([current]);
      } else {
        x.employee = x.employee.concat(current.employee);
        return acc;
      }
    }, []);

    // get all designation and map it with the result
    const allDesignation = await prisma.designation.findMany({
      orderBy: {
        id: "asc",
      },
    });

    const finalResult = allDesignation.map((item) => {
      const x = result.find((i) => i.designationId === item.id);
      if (!x) {
        return {
          designationId: item.id,
          designationName: item.name,
          employee: [],
        };
      } else {
        return x;
      }
    });

    const singleDesignation = finalResult.find(
      (item) => item.designationId === parseInt(req.params.id)
    );

    return res.status(200).json(singleDesignation);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteSingleDesignation = async (req, res) => {
  try {
    const deletedDesignation = await prisma.designation.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });

    if (!deletedDesignation) {
      return res.status(404).json({ message: "Designation delete to failed" });
    }
    return res.status(200).json(deletedDesignation);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createSingleDesignation,
  getAllDesignation,
  getSingleDesignation,
  updateSingleDesignation,
  allDesignationWiseEmployee,
  singleDesignationWiseEmployee,
  deleteSingleDesignation,
};
