const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

//create a new employee
const createSingleLeavePolicy = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many designation at once
      const deletedLeavePolicy = await prisma.leavePolicy.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });
      return res.status(200).json(deletedLeavePolicy);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.query === "createmany") {
    try {
      // create many designation from an array of objects
      const createdLeavePolicy = await prisma.leavePolicy.createMany({
        data: req.body,
        skipDuplicates: true,
      });
      return res.status(201).json(createdLeavePolicy);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    try {
      const createdLeavePolicy = await prisma.leavePolicy.create({
        data: {
          name: req.body.name,
          paidLeaveCount: parseInt(req.body.paidLeaveCount),
          unpaidLeaveCount: parseInt(req.body.unpaidLeaveCount),
        },
      });

      return res.status(201).json(createdLeavePolicy);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getAllLeavePolicy = async (req, res) => {
  if (req.query.query === "all") {
    const allLeavePolicy = await prisma.leavePolicy.findMany({
      orderBy: [
        {
          id: "desc",
        },
      ],
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

    return res.status(200).json(allLeavePolicy);
  } else if (req.query.status === "false") {
    const { skip, limit } = getPagination(req.query);
    try {
      const allLeavePolicy = await prisma.leavePolicy.findMany({
        orderBy: [
          {
            id: "desc",
          },
        ],
        where: {
          status: false,
        },
        skip: Number(skip),
        take: Number(limit),
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

      return res.status(200).json(allLeavePolicy);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allLeavePolicy = await prisma.leavePolicy.findMany({
        orderBy: [
          {
            id: "desc",
          },
        ],
        where: {
          status: true,
        },
        skip: Number(skip),
        take: Number(limit),
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

      return res.status(200).json(allLeavePolicy);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getSingeLeavePolicy = async (req, res) => {
  try {
    const singleLeavePolicy = await prisma.leavePolicy.findUnique({
      where: {
        id: parseInt(req.params.id),
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

    return res.status(200).json(singleLeavePolicy);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// const updateSingleLeavePolicy = async (req, res) => {
//   try {
//     const updatedLeavePolicy = await prisma.leavePolicy.update({
//       where: {
//         id: parseInt(req.params.id),
//       },
//       data: {
//         name: req.body.name,
//         paidLeaveCount: parseInt(req.body.paidLeaveCount),
//         unpaidLeaveCount: parseInt(req.body.unpaidLeaveCount),
//       },
//     });

//     return res.status(200).json(updatedLeavePolicy);
//   } catch (error) {
//     return res.status(400).json({ message: error.message });
//   }
// };


const updateSingleLeavePolicy = async (req, res) => {
  try {
    const leavePolicyId = parseInt(req.params.id);
    const updatedLeavePolicy = await prisma.leavePolicy.update({
      where: {
        id: leavePolicyId,
      },
      data: {
        name: req.body.name,
        paidLeaveCount: parseInt(req.body.paidLeaveCount),
        unpaidLeaveCount: parseInt(req.body.unpaidLeaveCount),
      },
    });

    // After updating leave policy, update all users with the new values
    const updatedUsers = await prisma.user.updateMany({
      where: {
        leavePolicyId: leavePolicyId,
      },
      data: {
        annualallowedleave: updatedLeavePolicy.paidLeaveCount.toString(),
        remainingannualallowedleave: updatedLeavePolicy.paidLeaveCount.toString(),
      },
    });

    return res.status(200).json({
      updatedLeavePolicy,
      updatedUsers,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// const deleteSingleLeavePolicy = async (req, res) => {
//   try {
//     const deletedLeavePolicy = await prisma.leavePolicy.delete({
//       where: {
//         id: parseInt(req.params.id),
//       },
//     });
//     const updatedUsers = await prisma.user.updateMany({
//       where: {
//         leavePolicyId: leavePolicyId,
//       },
//       data: {
//         annualallowedleave: null,
//         remainingannualallowedleave: null,
//       },
//     });
// console.log(updatedUsers);
//     return res.status(200).json({deletedLeavePolicy,updatedUsers
//     });
//   } catch (error) {
//     return res.status(400).json({ message: error.message });
//   }
// };
const deleteSingleLeavePolicy = async (req, res) => {
  try {
    const deletedLeavePolicy = await prisma.leavePolicy.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });
    // const updatedUsers = await prisma.user.updateMany({
    //   where: {
    //     leavePolicyId: leavePolicyId,
    //   },
    //   data: {
    //     annualallowedleave: null,
    //     remainingannualallowedleave: null,
    //   },
    // });

    return res.status(200).json({deletedLeavePolicy
    // ,updatedUsers
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createSingleLeavePolicy,
  getAllLeavePolicy,
  getSingeLeavePolicy,
  updateSingleLeavePolicy,
  deleteSingleLeavePolicy,
};
