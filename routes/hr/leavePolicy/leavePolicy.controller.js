const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");
const moment = require("moment");

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


// const updateSingleLeavePolicy = async (req, res) => {
//   try {
//     const leavePolicyId = parseInt(req.params.id);

//     // Update the leave policy document
//     const updatedLeavePolicy = await prisma.leavePolicy.update({
//       where: { id: leavePolicyId },
//       data: {
//         name: req.body.name,
//         paidLeaveCount: parseInt(req.body.paidLeaveCount),
//         unpaidLeaveCount: parseInt(req.body.unpaidLeaveCount),
//       },
//     });

//     // Find all users associated with this leave policy
//     const users = await prisma.user.findMany({
//       where: { leavePolicyId: leavePolicyId },
//     });

//     // Define date ranges for holidays (Sept 1 of previous year to Aug 31 of current year)
//     const currentYear = moment().tz("Europe/London").year();
//     const startOfRange = moment
//       .tz(`09-01-${currentYear - 1}`, "MM-DD-YYYY", "Europe/London")
//       .startOf("day")
//       .toDate();
//     const endOfRange = moment
//       .tz(`08-31-${currentYear}`, "MM-DD-YYYY", "Europe/London")
//       .endOf("day")
//       .toDate();

//     // Count total holidays and past holidays (up to today)
//     const totalHolidays = await prisma.publicHoliday.count({
//       where: {
//         date: {
//           gte: startOfRange,
//           lte: endOfRange,
//         },
//       },
//     });
//     const todayInLondon = moment().tz("Europe/London").startOf("day").toDate();
//     const pastHolidays = await prisma.publicHoliday.count({
//       where: {
//         date: {
//           gte: startOfRange,
//           lte: todayInLondon,
//         },
//       },
//     });

  

//     let updatedUsers = [];
//     for (let i = 0; i < users.length; i++) {
//       // Retrieve leave applications for the user for the current year, excluding rejected ones
//      const leaveApplications = await prisma.leaveApplication.findMany({
//   where: {
//     userId: users[i].id,
//   leavecategory: "paid",
//     leaveFrom: { gte: startOfRange, lte: endOfRange },
//     leaveTo: { gte: startOfRange, lte: endOfRange },
//     OR: [
//       { status: "APPROVED" },
//       { status: "PENDING" }
//     ],
    
//   },
// });

//  const totalLeaveDays = leaveApplications
//       .filter((l) => l.leavecategory === "paid")
//       .reduce((acc, item) => acc + item?.leaveDuration, 0);


// console.log("Total Leave Days:", totalLeaveDays);

//       const paidLeavesUsed = totalLeaveDays;
//       const remainingPaidLeaves = updatedLeavePolicy.paidLeaveCount - paidLeavesUsed;
//       const remainingUnpaidLeaves = updatedLeavePolicy.unpaidLeaveCount - pastHolidays;
//   const paidleavescount=updatedLeavePolicy.paidLeaveCount-totalLeaveDays;
//       // Update the user's leave details individually
//       const updatedUser = await prisma.user.update({
//         where: { id: users[i].id },
//         data: {
//           annualallowedleave: updatedLeavePolicy.paidLeaveCount.toString(),
//           remainingannualallowedleave: paidleavescount.toString(),
//           bankallowedleave: updatedLeavePolicy.unpaidLeaveCount.toString(),
//           remainingannualallowedleave: remainingUnpaidLeaves.toString(),
//         },
//       });
//       updatedUsers.push(updatedUser);
//     }

//     return res.status(200).json({
//       updatedLeavePolicy,
//       updatedUsers,
//     });
//   } catch (error) {
//     return res.status(400).json({ message: error.message });
//   }
// };

const updateSingleLeavePolicy = async (req, res) => {
  try {
    const leavePolicyId = parseInt(req.params.id);

    // Update the leave policy document
    const updatedLeavePolicy = await prisma.leavePolicy.update({
      where: { id: leavePolicyId },
      data: {
        name: req.body.name,
        paidLeaveCount: parseInt(req.body.paidLeaveCount),
        unpaidLeaveCount: parseInt(req.body.unpaidLeaveCount),
      },
    });

    // Find all users associated with this leave policy
    const users = await prisma.user.findMany({
      where: { leavePolicyId: leavePolicyId },
    });

    // Define date ranges for holidays (Sept 1 of previous year to Aug 31 of current year)
    const currentYear = moment().tz("Europe/London").year();
    const startOfRange = moment
      .tz(`09-01-${currentYear - 1}`, "MM-DD-YYYY", "Europe/London")
      .startOf("day")
      .toDate();
    const endOfRange = moment
      .tz(`08-31-${currentYear}`, "MM-DD-YYYY", "Europe/London")
      .endOf("day")
      .toDate();

    // Count total holidays and past holidays (up to today)
    const totalHolidays = await prisma.publicHoliday.count({
      where: {
        date: {
          gte: startOfRange,
          lte: endOfRange,
        },
      },
    });
    const todayInLondon = moment().tz("Europe/London").startOf("day").toDate();
    const pastHolidays = await prisma.publicHoliday.count({
      where: {
        date: {
          gte: startOfRange,
          lte: todayInLondon,
        },
      },
    });

    let updatedUsers = [];
    for (let i = 0; i < users.length; i++) {
      // Retrieve leave applications for the user for the current year, excluding rejected ones
      const leaveApplications = await prisma.leaveApplication.findMany({
        where: {
          userId: users[i].id,
          leavecategory: "paid",
          leaveFrom: { gte: startOfRange, lte: endOfRange },
          leaveTo: { gte: startOfRange, lte: endOfRange },
          OR: [
            { status: "APPROVED" },
            { status: "PENDING" }
          ],
        },
      });

      // Calculate total paid leave days used by the user
      const totalLeaveDays = leaveApplications
        .filter((l) => l.leavecategory === "paid")
        .reduce((acc, item) => acc + item?.leaveDuration, 0);

      console.log("Total Leave Days:", totalLeaveDays);

      // Calculate remaining paid and unpaid leaves
      const remainingPaidLeaves = updatedLeavePolicy.paidLeaveCount - totalLeaveDays;
      const remainingUnpaidLeaves = updatedLeavePolicy.unpaidLeaveCount - pastHolidays;

      // Update the user's leave details
        const updatedUser = await prisma.user.update({
        where: { id: users[i].id },
        data: {
          annualallowedleave: updatedLeavePolicy.paidLeaveCount.toString(), // Update total allowed paid leaves
          remainingannualallowedleave: remainingPaidLeaves.toString(), // Update remaining paid leaves
          bankallowedleave: updatedLeavePolicy.unpaidLeaveCount.toString(), // Update total allowed unpaid leaves
          remaingbankallowedleave: remainingUnpaidLeaves.toString(), // Update remaining unpaid leaves (corrected field name)
        },
      });

      updatedUsers.push(updatedUser);
    }

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
