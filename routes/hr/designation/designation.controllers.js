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
          id: "desc",
        },
      });
      return res.status(200).json(allDesignation);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }else if (req.query.status === 'true') { // Note the comparison to 'true' as a string
    try {
      // Get all designations with status set to true
      const allDesignation = await prisma.designation.findMany({
        where: {
          status: true,
        },
        orderBy: {
          id: "desc",
        },
      });
      return res.status(200).json(allDesignation);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
   else {
    const { skip, limit } = getPagination(req.query);
    try {
      // get all designation paginated
      const allDesignation = await prisma.designation.findMany({
        orderBy: {
          id: "desc",
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
console.log(designationWiseEmployee);
    // const data = designationWiseEmployee.map((item) => {
    //   return {
    //     designationId: item.designationHistory[0].designation.id,
    //     designationName: item.designationHistory[0].designation.name,
    //     employee: [
    //       {
    //         id: item.id,
    //         firstName: item.firstName,
    //         lastName: item.lastName,
    //       },
    //     ],
    //   };
    // });
    const data = designationWiseEmployee.map((item) => {
      if (item.designationHistory && item.designationHistory[0] && item.designationHistory[0].designation) {
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
      }
      return null; 
    }).filter(Boolean); 
    

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
        id: "desc",
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
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
};

// const singleDesignationWiseEmployee = async (req, res) => {
//   try {
//     const designationWiseEmployee = await prisma.user.findMany({
//       select: {
//         id: true,
//         firstName: true,
//         lastName: true,
//         designationHistory: {
//           select: {
//             designation: {
//               select: {
//                 id: true,
//                 name: true,
//               },
//             },
//           },
      //     orderBy: {
      //       id: "desc",
      //     },
      //     take: 1,
      //   },
      // },
//     });

//     const data = designationWiseEmployee.map((item) => {
//       return {
//         designationId: item.designationHistory[0].designation.id,
//         designationName: item.designationHistory[0].designation.name,
//         employee: [
//           {
//             id: item.id,
//             firstName: item.firstName,
//             lastName: item.lastName,
//           },
//         ],
//       };
//     });

//     const result = data.reduce((acc, current) => {
//       const x = acc.find(
//         (item) => item.designationId === current.designationId
//       );
//       if (!x) {
//         return acc.concat([current]);
//       } else {
//         x.employee = x.employee.concat(current.employee);
//         return acc;
//       }
//     }, []);

//     // get all designation and map it with the result
//     const allDesignation = await prisma.designation.findMany({
//       orderBy: {
//         id: "asc",
//       },
//     });

//     const finalResult = allDesignation.map((item) => {
//       const x = result.find((i) => i.designationId === item.id);
//       if (!x) {
//         return {
//           designationId: item.id,
//           designationName: item.name,
//           employee: [],
//         };
//       } else {
//         return x;
//       }
//     });

//     const singleDesignation = finalResult.find(
//       (item) => item.designationId === parseInt(req.params.id)
//     );

//     return res.status(200).json(singleDesignation);
//   } catch (error) {
//     return res.status(400).json({ message: error.message });
//   }
// };

// const deleteSingleDesignation = async (req, res) => {
//   try {
//     const deletedDesignation = await prisma.designation.delete({
//       where: {
//         id: parseInt(req.params.id),
//       },
//     });

//     if (!deletedDesignation) {
//       return res.status(404).json({ message: "Designation delete to failed" });
//     }
//     return res.status(200).json(deletedDesignation);
//   } catch (error) {
//     return res.status(400).json({ message: error.message });
//   }
// };


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
      // Check if designationHistory exists and is not empty
      if (item.designationHistory && item.designationHistory.length > 0) {
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
      } else {
        // Handle the case where designationHistory is empty
        return {
          designationId: null, // or any appropriate default value
          designationName: null, // or any appropriate default value
          employee: [
            {
              id: item.id,
              firstName: item.firstName,
              lastName: item.lastName,
            },
          ],
        };
      }
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
  const designationId = parseInt(req.params.id);

  try {
    // Check if any users have a designation history with the specified designation
    const userCountWithDesignation = await prisma.user.count({
      where: {
        designationHistory: {
          some: {
            designationId: designationId,
          },
        },
      },
    });

    if (userCountWithDesignation > 0) {
      return res.status(400).json({
        
        message: `Cannot delete designation. It is assigned ${userCountWithDesignation} users`,
      });
    }

    // If no users have the designation, you can proceed with deletion
    const relatedHistoryRecords = await prisma.designationHistory.findMany({
      where: {
        designationId: designationId,
      },
    });

    if (relatedHistoryRecords.length > 0) {
      await prisma.designationHistory.deleteMany({
        where: {
          designationId: designationId,
        },
      });
    }

    const deletedDesignation = await prisma.designation.delete({
      where: {
        id: designationId,
      },
    });

    if (!deletedDesignation) {
      return res.status(404).json({ message: "Designation delete failed" });
    }

    return res.status(200).json({
      deletedDesignation,
      message: "Designation is deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
