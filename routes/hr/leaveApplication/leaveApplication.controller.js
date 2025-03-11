const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");
const admin = require("firebase-admin");
var FCM = require("fcm-node");
const sendEmail = require("../../../utils/emails");



const createSingleLeave = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many designations at once
      const deletedLeave = await prisma.leaveApplication.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });
      return res.status(200).json(deletedLeave);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    try {
      console.log(req.body.userId, "req.body.userId");
      const userwithrole = await prisma.user.findMany({
        where: {
          roleId: {
            in: [1, 3, 4, 5, 6, 7], // Use 'in' operator to match multiple values
          },
        },
      });

      const leaveFrom = new Date(req.body.leaveFrom);
      // leaveFrom.setHours(0,0,0,0)
      const leaveTo = new Date(req.body.leaveTo);
      leaveTo.setHours(23, 59, 59, 59);
      const user = await prisma.user.findUnique({
        where: {
          id: parseInt(req.body.userId),
        },
      });
      const locationfind = await prisma.location.findFirst({
        where: {
          id: user.locationId,
        },
      });
      if (!user) {
        return res.status(400).json({ message: "User not found." });
      }

      const overlappingLeaveCount = await prisma.leaveApplication.count({
        where: {
          AND: [
            {
              leaveFrom: { lte: leaveTo },
            },
            {
              leaveTo: { gte: leaveFrom },
            },
            {
              status: "APPROVED",
            },
          ],
        },
      });

      if (overlappingLeaveCount >= 2) {
        return res.status(400).json({
          message: "2 Leaves are already approved for the same date.",
        });
      }

      const training = await prisma.training.findMany({
        where: {
          OR: [
            {
              AND: [
                { leaveFrom: { lte: new Date(leaveTo) } },
                { leaveTo: { gte: new Date(leaveFrom) } },
              ],
            },
          ],
        },
      });

      if (training.length > 0) {
        return res
          .status(400)
          .json({ message: "You can't apply for leave on a training day." });
      }

      if ([0, 1, 8].includes(leaveFrom.getMonth())) {
        return res
          .status(400)
          .json({ message: "Leaves are not allowed in Jan, Feb, & Sep." });
      }
      var Difference_In_Time = leaveTo.getTime() - leaveFrom.getTime();

      //   var leaveDuration = Math.round(Difference_In_Time / (1000 * 3600 * 24));
      var leaveDuration = calculateWeekdaysBetween(leaveFrom, leaveTo);

      if (leaveFrom.toDateString() === leaveTo.toDateString()) {
        if (req.body.daytype === "FULL") {
          leaveDuration = leaveDuration;
        } else if (req.body.daytype === "HALF") {
          leaveDuration = leaveDuration / 2;
        }
      } else {
        if (req.body.daytype === "HALF") {
          leaveDuration = leaveDuration / 2;
        }
      }
      if (user.remainingannualallowedleave < leaveDuration) {
        return res
          .status(400)
          .json({ message: "Not enough remaining annual leave." });
      }
      const currentYear = new Date().getFullYear();
      const startOfCurrentYearSept = new Date(`${currentYear}-09-01`);
      console.log(startOfCurrentYearSept, "startOfCurrentYearSept");
      const startOfPrevYearSept = new Date(`${currentYear - 1}-09-01`);
      console.log(startOfPrevYearSept, "startOfPrevYearSept");

      if (
        leaveFrom >= startOfPrevYearSept &&
        leaveFrom < startOfCurrentYearSept &&
        req.body.leaveType.includes("deductible")
      ) {
        if (user.remainingannualallowedleave < leaveDuration) {
          return res.status(400).json({
            message: "Not enough remaining annual leave for this period.",
          });
        }

        user.remainingannualallowedleave -= leaveDuration;
        await prisma.user.update({
          where: { id: parseInt(req.body.userId) },
          data: {
            remainingannualallowedleave:
              user.remainingannualallowedleave.toString(),
          },
        });
      }
      let todayDate = new Date();
      var Difference_In_Time2 = leaveFrom.getTime() - todayDate.getTime();
      var Difference_In_Days = Math.round(
        Difference_In_Time2 / (1000 * 3600 * 24)
      );
      const submitDays = Math.ceil(leaveDuration) * 2 + 1;
      if (Difference_In_Days < submitDays) {
        return res.status(400).json({
          message: `Apply at least ${submitDays} days before.`,
        });
      }
      const existingLeave = await prisma.leaveApplication.findFirst({
        where: {
          userId: parseInt(req.body.userId),
          leaveFrom: { lte: leaveTo },
          leaveTo: { gte: leaveFrom },
          status: "APPROVED",
        },
      });

      if (existingLeave) {
        return res
          .status(400)
          .json({ message: "leave is already approved for same day." });
      }
      const leaveType = req.body.leaveType; // Get the leaveType from the request

      let leavecategory;
      if (
        leaveType === "CompassionateLeave(deductible)" ||
        leaveType === "BereavementLeave(deductible)" ||
        leaveType === "ParentalLeave(deductible)" ||
        leaveType === "PaternityLeave(deductible-if-paid)" ||
        leaveType === "AnnualLeave(deductible)"
      ) {
        leavecategory = "paid"; // Set leavecategory to 'paid'
      } else {
        leavecategory = "unpaid"; // Set leavecategory to 'unpaid'
      }
      const createdLeave = await prisma.leaveApplication.create({
        data: {
          user: {
            connect: {
              id: parseInt(req.body.userId),
            },
          },
          leaveType: leaveType,
          leavecategory: leavecategory,
          daytype: req.body.daytype,
          fromtime: req.body.fromtime,
          totime: req.body.totime,
          leaveFrom: leaveFrom,
          leaveTo: leaveTo,
          leaveDuration: leaveDuration,
          reason: req.body.reason ? req.body.reason : undefined,
          attachment: req.body.attachment ? req.body.attachment : null,
          createdAt: leaveTo,
          updatedAt: leaveTo,
        },
      });
    //   if (req.body.daytype === "HALF") {
    //     leaveDuration = leaveDuration;
    //   }
    //   let remainingannualallowedleave = (
    //      user.remainingannualallowedleave - leaveDuration
    //   ).toString();
    //   if (
    //      req.body.leaveType === "CompassionateLeave(deductible)" ||
    //      req.body.leaveType === "BereavementLeave(deductible)" ||
    //      req.body.leaveType === "ParentalLeave(deductible)" ||
    //      req.body.leaveType === "PaternityLeave(deductible-if-paid)" ||
    //      req.body.leaveType === "AnnualLeave(deductible)"
    //   ) {
    //      await prisma.user.update({
    //       where: {
    //          id: parseInt(req.body.userId),
    //       },
    //       data: {
    //          remainingannualallowedleave: remainingannualallowedleave,
    //       },
    //      });
    //   }
      for (const users of userwithrole) {
        if (users.id !== user.id) {
          await sendEmail("leaveapply", {
            email: users.email,
            useremail: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            leaveFrom: leaveFrom.toDateString(),
            leaveTo: leaveTo.toDateString(),
            duration: leaveDuration,
            location: locationfind.locationName,
            leaveType: leaveType,
            date: new Date().toDateString(),

            adminFirstName: users.firstName,
            adminLastName: users.lastName,
          });
        }
      }
      return res.status(200).json({
        createdLeave,
        message: "Your leave application is submitted successfully.",
      });
    } catch (error) {
      console.log(error);

      return res
        .status(400)
        .json({ message: "Failed to submit leave application." });
    }
  }
};
const adminSingleLeave = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many designations at once
      const deletedLeave = await prisma.leaveApplication.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });
      return res.status(200).json(deletedLeave);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    try {
      const leaveFrom = new Date(req.body.leaveFrom);
      // leaveFrom.setHours(0,0,0,0)
      const leaveTo = new Date(req.body.leaveTo);

      console.log(leaveFrom, leaveTo);

      leaveTo.setHours(23, 59, 59, 59);

      const user = await prisma.user.findUnique({
        where: {
          employeeId: req.body.employeeId,
        },
      });
      if (!user) {
        return res.status(400).json({ message: "User not found." });
      }

      const overlappingLeaveCount = await prisma.leaveApplication.count({
        where: {
          AND: [
            {
              leaveFrom: { lte: leaveTo },
            },
            {
              leaveTo: { gte: leaveFrom },
            },
            {
              status: "APPROVED",
            },
          ],
        },
      });

      // if (overlappingLeaveCount >= 2) {
      //   return res
      //     .status(400)
      //     .json({
      //       message: "2 Leaves are already approved for the same date.",
      //     });
      // }

      const training = await prisma.training.findMany({
        where: {
          OR: [
            {
              AND: [
                { leaveFrom: { lte: new Date(leaveTo) } },
                { leaveTo: { gte: new Date(leaveFrom) } },
              ],
            },
          ],
        },
      });

      // if (training.length > 0) {
      //   return res
      //     .status(400)
      //     .json({ message: "You can't apply for leave on a training day." });
      // }
      // if ([0, 1, 8].includes(leaveFrom.getMonth())) {
      //   return res
      //     .status(400)
      //     .json({ message: "Leaves are not allowed in Jan, Feb, & Sep." });
      // }
      var Difference_In_Time = leaveTo.getTime() - leaveFrom.getTime();

      // var leaveDuration = Math.round(Difference_In_Time / (1000 * 3600 * 24));
      var leaveDuration = calculateWeekdaysBetween(leaveFrom, leaveTo);

      if (leaveFrom.toDateString() === leaveTo.toDateString()) {
        // Single-day leave
        if (req.body.daytype === "FULL") {
          leaveDuration = leaveDuration; // One-day full leave
        } else if (req.body.daytype === "HALF") {
          leaveDuration = leaveDuration / 2; // One-day half leave
        }
      } else {
        if (req.body.daytype === "HALF") {
          leaveDuration = leaveDuration / 2; // Adjust for half-day leave
        }
      }
      if (user.remainingannualallowedleave < leaveDuration) {
        return res
          .status(400)
          .json({ message: "Not enough remaining annual leave." });
      }
      const currentYear = new Date().getFullYear();
      const startOfCurrentYearSept = new Date(`${currentYear}-09-01`);
      const startOfPrevYearSept = new Date(`${currentYear - 1}-09-01`);

      if (
        leaveFrom >= startOfPrevYearSept &&
        leaveFrom < startOfCurrentYearSept &&
        req.body.leaveType.includes("deductible")
      ) {
        if (user.remainingannualallowedleave < leaveDuration) {
          return res.status(400).json({
            message: "Not enough remaining annual leave for this period.",
          });
        }

        user.remainingannualallowedleave -= leaveDuration;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            remainingannualallowedleave:
              user.remainingannualallowedleave.toString(),
          },
        });
      }
      let todayDate = new Date();
      var Difference_In_Time2 = leaveFrom.getTime() - todayDate.getTime();
      var Difference_In_Days = Math.round(
        Difference_In_Time2 / (1000 * 3600 * 24)
      );
      const submitDays = Math.ceil(leaveDuration) * 2 + 1;

      const existingLeave = await prisma.leaveApplication.findFirst({
        where: {
          user: {
            employeeId: req.body.employeeId.toString(),
          },
          leaveFrom: { lte: leaveTo },
          leaveTo: { gte: leaveFrom },
          status: "APPROVED",
        },
      });

      if (existingLeave) {
        return res
          .status(400)
          .json({ message: "Your leave is already approved for same day." });
      }
      const leaveType = req.body.leaveType; // Get the leaveType from the request

      let leavecategory;
      if (
        leaveType === "CompassionateLeave(deductible)" ||
        leaveType === "BereavementLeave(deductible)" ||
        leaveType === "ParentalLeave(deductible)" ||
        leaveType === "PaternityLeave(deductible-if-paid)" ||
        leaveType === "AnnualLeave(deductible)"
      ) {
        leavecategory = "paid"; // Set leavecategory to 'paid'
      } else {
        leavecategory = "unpaid"; // Set leavecategory to 'unpaid'
      }
      let status = "PENDING";

      const createdLeave = await prisma.leaveApplication.create({
        data: {
          user: {
            connect: {
              employeeId: req.body.employeeId,
            },
          },
          acceptLeaveBy: status === "PENDING" ? null : req.auth.sub,
          leaveType:leaveType,
          leavecategory: leavecategory,
          daytype: req.body.daytype,
          fromtime: req.body.fromtime,
          totime: req.body.totime,
          leaveFrom: leaveFrom,
          status: status,
          leaveTo: leaveTo,
          leaveDuration: leaveDuration,
          reason: req.body.reason ? req.body.reason : undefined,
          attachment: req.body.attachment ? req.body.attachment : null,
          createdAt: leaveTo,
          updatedAt: leaveTo, // Include submitDate inside the data object
        },
      });
      console.log(createdLeave);

    //   if (req.body.daytype === "HALF") {
    //     leaveDuration = leaveDuration;
    //   }
    //   console.log(
    //     user.remainingannualallowedleave,
    //     "user.remainingannualallowedleave"
    //   );
    //   console.log(leaveDuration, "leaveDuration");
    //   let remainingannualallowedleave = (
    //      user.remainingannualallowedleave - leaveDuration
    //   ).toString();

    //   if (
    //      req.body.leaveType === "CompassionateLeave(deductible)" ||
    //      req.body.leaveType === "BereavementLeave(deductible)" ||
    //      req.body.leaveType === "ParentalLeave(deductible)" ||
    //      req.body.leaveType === "PaternityLeave(deductible-if-paid)" ||
    //      req.body.leaveType === "AnnualLeave(deductible)"
    //   ) {
    //      await prisma.user.update({
    //       where: {
    //          employeeId: req.body.employeeId,
    //       },
    //       data: {
    //          remainingannualallowedleave: remainingannualallowedleave,
    //       },
    //      });
    //   }

      return res.status(200).json({
        createdLeave,
        message: "Your leave application is submitted successfully.",
      });
    } catch (error) {
      console.log(error);

      return res
        .status(400)
        .json({ message: "Failed to Submit leave application." });
    }
  }
};
  
function calculateWeekdaysBetween(startDate, endDate) {
  let count = 0;
  let currentDate = new Date(startDate);
  endDate = new Date(endDate);

  // Set the time to midnight for accurate comparison
  currentDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    // Exclude Saturday (6) and Sunday (0)
    if (dayOfWeek !== 6 && dayOfWeek !== 0) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return count;
}



const getapprovedAllLeave = async (req, res) => {
  try {
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0
    );
    const todayEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
      0,
      0,
      0
    );

    const todayApproved = await prisma.leaveApplication.findMany({
      where: {
        status: "APPROVED",
        OR: [
          {
            createdAt: { gte: todayStart, lt: todayEnd },
          },
          {
            updatedAt: { gte: todayStart, lt: todayEnd },
          },
        ],
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            userName: true,
            employeeId: true,
            department: true,
          },
        },
      },
    });
    const result = await Promise.all(
      todayApproved.map(async (item) => {
        const acceptLeaveBy = item.acceptLeaveBy
          ? await prisma.user.findUnique({ where: { id: item.acceptLeaveBy } })
          : null;

        return {
          ...item,
          acceptLeaveBy: acceptLeaveBy,
        };
      })
    );

    const approvedLeaveCount = result.length;

    return res.status(200).json({
      count: approvedLeaveCount,
      todayApproved: result,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
const getSingleLeave = async (req, res) => {
  try {
    const singleLeaveId = Number(req.params.id);

    const singleLeave = await prisma.leaveApplication.findUnique({
      where: {
        id: singleLeaveId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userName: true,
            employeeId: true,
            department: true,
          },
        },
      },
    });

    if (!singleLeave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    let acceptLeaveBy = null;
    if (singleLeave.acceptLeaveBy) {
      acceptLeaveBy = await prisma.user.findUnique({
        where: {
          id: singleLeave.acceptLeaveBy,
        },
        select: {
          firstName: true,
          lastName: true,
        },
      });
    }

    // Fetch all approved leave applications within the same date range
    const todayApproved = await prisma.leaveApplication.findMany({
      where: {
        status: "APPROVED",
        OR: [
          {
            leaveFrom: {
              lte: singleLeave.leaveTo, // Leave starts before or on singleLeave.leaveTo
            },
            leaveTo: {
              gte: singleLeave.leaveFrom, // Leave ends after or on singleLeave.leaveFrom
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true,
          },
        },
      },
    });

    const approvedLeaveApplications = await Promise.all(
      todayApproved.map(async (item) => {
        const acceptLeaveBy = item.acceptLeaveBy
          ? await prisma.user.findUnique({ where: { id: item.acceptLeaveBy } })
          : null;

        return {
          ...item,
          date: singleLeave.leaveFrom,
          acceptLeaveBy: acceptLeaveBy,
        };
      })
    );
    const approvedLeaveCount = approvedLeaveApplications.length;

    const result = {
      ...singleLeave,
      approvedLeaveCount: approvedLeaveCount,
      approvedLeaveApplications: approvedLeaveApplications,
    };

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const grantedLeave = async (req, res, next) => {
  try {
    const acceptLeaveFrom = new Date(req.body.acceptLeaveFrom);
    const acceptLeaveTo = new Date(req.body.acceptLeaveTo);

    let grantedLeave;

    // Fetch the existing leave application
    const existingLeave = await prisma.leaveApplication.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        user: true,
      },
    });
    const leaveDuration = existingLeave.leaveDuration;

    if (!existingLeave) {
      return res.status(404).json({ message: "Leave application not found." });
    }

    if (existingLeave.status === "PENDING" && req.body.status === "APPROVED") {
      // If status was changed from 'REJECTED' to 'APPROVED', deduct the leave duration from remaining leaves
      const currentRemainingLeaves = parseFloat(
        existingLeave.user.remainingannualallowedleave
      );
      // await prisma.user.update({
      //   where: {
      //     id: existingLeave.user.id,
      //   },
      //   data: {
      //     remainingannualallowedleave: currentRemainingLeaves ? currentRemainingLeaves.toString() : '',
      //   },
      // });
      const Title = "Leave Approved";
      const Body =
        existingLeave.user.firstName +
        " " +
        existingLeave.user.lastName +
        "  " +
        "Your leave request has been approved.";
      const Desc = "Leave approval notification";
      const Token = existingLeave.user.firebaseToken;
      // const Device = existingLeave.user.device;
      console.log(Title, Body, Desc, Token);
      sendnotifiy(Title, Body, Desc, Token);
    } else if (
      existingLeave.status === "PENDING" &&
      req.body.status === "REJECTED"
    ) 
    {
      if (existingLeave.leaveDuration) {
        if (existingLeave.leavecategory === "paid") {
            
        
    
          const currentRemainingLeaves = parseFloat(
            existingLeave.user.remainingannualallowedleave
          );
          const updatedRemainingLeaves = Math.max(
            currentRemainingLeaves + existingLeave.leaveDuration,
            0
          );
          
             
    
          await prisma.user.update({
            where: {
              id: existingLeave.user.id,
            },
            data: {
              remainingannualallowedleave: updatedRemainingLeaves.toString(),
            },
          });
        } else {
          const currentRemainingLeaves = parseFloat(
            existingLeave.user.remainingannualallowedleave
          );
          const updatedRemainingLeaves = Math.max(currentRemainingLeaves, 0);
          await prisma.user.update({
            where: {
              id: existingLeave.user.id,
            },
            data: {
              remainingannualallowedleave: updatedRemainingLeaves.toString(),
            },
          });
        }
        const Title = "Leave Rejected";
        const Body =
          existingLeave.user.firstName +
          " " +
          existingLeave.user.lastName +
          "  " +
          "Your leave request has been rejected.";
        const Desc = "Leave rejection notification";
        const Token = existingLeave.user.firebaseToken;
        sendnotifiy(Title, Body, Desc, Token);
      }
      
    
  
    } else if (
      existingLeave.status === "APPROVED" &&
      req.body.status === "REJECTED"
    ) 
    {
      if (existingLeave.leavecategory === "paid") {
        const currentRemainingLeaves = parseFloat(
          existingLeave.user.remainingannualallowedleave
        );
        const updatedRemainingLeaves = Math.max(
          currentRemainingLeaves + existingLeave.leaveDuration,
          0
        );

        await prisma.user.update({
          where: {
            id: existingLeave.user.id,
          },
          data: {
            remainingannualallowedleave: updatedRemainingLeaves.toString(),
          },
        });
      } else {
        const currentRemainingLeaves = parseFloat(
          existingLeave.user.remainingannualallowedleave
        );
        const updatedRemainingLeaves = Math.max(currentRemainingLeaves, 0);

        await prisma.user.update({
          where: {
            id: existingLeave.user.id,
          },
          data: {
            remainingannualallowedleave: updatedRemainingLeaves.toString(),
          },
        });
      }
      const Title = "Leave Rejected";
      const Body =
        existingLeave.user.firstName +
        " " +
        existingLeave.user.lastName +
        "  " +
        "Your leave request has been rejected.";
      const Desc = "Leave rejection notification";
      const Token = existingLeave.user.firebaseToken;
      sendnotifiy(Title, Body, Desc, Token);
    } else if (
      existingLeave.status === "REJECTED" &&
      req.body.status === "APPROVED"
    ) {
      if (existingLeave.leavecategory === "paid") {
        const currentRemainingLeaves = parseFloat(
          existingLeave.user.remainingannualallowedleave
        );
        const updatedRemainingLeaves = Math.max(
          currentRemainingLeaves - existingLeave.leaveDuration,
          0
        );

        await prisma.user.update({
          where: {
            id: existingLeave.user.id,
          },
          data: {
            remainingannualallowedleave: updatedRemainingLeaves.toString(),
          },
        });
      } else {
        const currentRemainingLeaves = parseFloat(
          existingLeave.user.remainingannualallowedleave
        );
        const updatedRemainingLeaves = Math.max(currentRemainingLeaves, 0);

        await prisma.user.update({
          where: {
            id: existingLeave.user.id,
          },
          data: {
            remainingannualallowedleave: updatedRemainingLeaves.toString(),
          },
        });
      }

      const Title = "Leave Approved";
      const Body =
        existingLeave.user.firstName +
        " " +
        existingLeave.user.lastName +
        "  " +
        "Your leave request has been approved.";
      const Desc = "Leave approval notification";
      const Token = existingLeave.user.firebaseToken;
      // const Device = existingLeave.user.device;
      sendnotifiy(Title, Body, Desc, Token);
    }

    // Update the leave details
    grantedLeave = await prisma.leaveApplication.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        acceptLeaveBy: req.auth.sub,
        acceptLeaveFrom: acceptLeaveFrom ? acceptLeaveFrom : undefined,
        acceptLeaveTo: acceptLeaveTo ? acceptLeaveTo : undefined,
        leaveDuration: leaveDuration !== undefined ? leaveDuration : 0,
        reviewComment: req.body.reviewComment
          ? req.body.reviewComment
          : undefined,
        status: req.body.status,
      },
    });
    if (existingLeave.status === "PENDING" && req.body.status === "APPROVED") {
      req.body.userId = existingLeave.user.id;
      req.body.grantedLeave = grantedLeave;
      req.body.fromleave = true;
      next();
    } else if (
      existingLeave.status === "REJECTED" &&
      req.body.status === "APPROVED"
    ) {
      req.body.userId = existingLeave.user.id;
      req.body.grantedLeave = grantedLeave;
      req.body.fromleave = true;
      next();
    } else if (
      existingLeave.status === "APPROVED" &&
      req.body.status === "REJECTED"
    ) {
      //   req.body.status = 'REJECTED';
      req.body.userId = existingLeave.user.id;
      req.body.grantedLeave = grantedLeave;
      req.body.fromleave = true;
      next();
    } else {
      return res.status(200).json({
        grantedLeave,
        message: "Application status is updated",
      });
    }
  } catch (error) {
    console.log("Errorrrrrrr", error);
    return res
      .status(400)
      .json({ message: "Failed to update application status" });
  }
};

const getLeaveByUserId = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    // Fetch leave applications for the user
    const getLeaveTo = await prisma.leaveApplication.findMany({
      where: {
        userId,
      },
      orderBy: [{ id: "desc" }],
      include: {
        user: {
          select: {
            annualallowedleave: true,
            remainingannualallowedleave: true,
            bankallowedleave: true,
            remaingbankallowedleave: true,
          },
        },
      },
    });
    const singleLeave = await Promise.all(
      getLeaveTo.map(async (leave) => {
        let approvedByUser = null;
        if (leave.acceptLeaveBy) {
          approvedByUser = await prisma.user.findUnique({
            where: {
              id: leave.acceptLeaveBy,
            },
          });
        }

        return {
          ...leave,
          approvedBy: approvedByUser,
        };
      })
    );
    let AcqiredpaidLeave = 0;
    let AcqiredunpaidLeave = 0;
    let paidLeavePending = 0;
    let unpaidLeavePending = 0;
    singleLeave.forEach((leave) => {
      if (leave.leavecategory === "paid") {
        if (leave.leaveType.includes("deductible")) {
          if (leave.status === "PENDING") {
            paidLeavePending++;
          } else if (leave.status === "APPROVED") {
            // AcqiredpaidLeave++;
            AcqiredpaidLeave += leave.leaveDuration;
          }
        }
      } else if (leave.leavecategory === "unpaid") {
        if (leave.leaveType.includes("non-deductible")) {
          if (leave.status === "PENDING") {
            unpaidLeavePending++;
          } else if (leave.status === "APPROVED") {
            // AcqiredunpaidLeave++;
            AcqiredunpaidLeave += leave.leaveDuration;
          }
        }
      }
    });
    const totalAcceptedLeaves = singleLeave.filter(
      (leave) => leave.status === "APPROVED"
    ).length;

    const totalRejectedLeaves = singleLeave.filter(
      (leave) => leave.status === "REJECTED"
    ).length;

    const totalPendingLeaves = singleLeave.filter(
      (leave) => leave.status === "PENDING"
    ).length;

    return res.status(200).json({
      singleLeave,
      AcqiredpaidLeave,
      AcqiredunpaidLeave,
      paidLeavePending,
      unpaidLeavePending,
      totalAcceptedLeaves,
      totalRejectedLeaves,
      totalPendingLeaves,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteSingleLeave = async (req, res) => {
  try {
    const deletedLeaveApplication = await prisma.leaveApplication.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });
    return res.status(200).json({
      deletedLeaveApplication,
      message: "Leave application deleted successfully.",
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Failed to delete leave application. " });
  }
};
const todayLeaveState = async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Get the start of the current week (Sunday)
    const endOfWeek = new Date(today);
    endOfWeek.setDate(startOfWeek.getDate() + 7); // Get the end of the current week (Sunday of the next week)
    const weeklyLeaves = await prisma.leaveApplication.findMany({
      where: {
        OR: [
          {
            createdAt: { gte: startOfWeek, lt: endOfWeek },
          }
        ],
      },
    });
  const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);  // Set to start of today, local time
    
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999); // Set to end of today, just before midnight, local time
    
    const todayLeaves = await prisma.leaveApplication.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
          lt: endOfToday,
        },
      },
    });

    // Initialize counts for each day
    const dayCounts = {
      Mon: { total: 0, approved: 0, pending: 0, rejected: 0 },
      Tue: { total: 0, approved: 0, pending: 0, rejected: 0 },
      Wed: { total: 0, approved: 0, pending: 0, rejected: 0 },
      Thu: { total: 0, approved: 0, pending: 0, rejected: 0 },
      Fri: { total: 0, approved: 0, pending: 0, rejected: 0 },
      Sat: { total: 0, approved: 0, pending: 0, rejected: 0 },
      Sun: { total: 0, approved: 0, pending: 0, rejected: 0 },
    };

    const dayNameMapping = {
      Monday: "Mon",
      Tuesday: "Tue",
      Wednesday: "Wed",
      Thursday: "Thu",
      Friday: "Fri",
      Saturday: "Sat",
      Sunday: "Sun",
    };

    // Update counts based on leave status and day of the week
    weeklyLeaves.forEach((leave) => {
      const dayOfWeek = new Date(leave.createdAt).toLocaleString("en-us", {
        weekday: "long",
      });
      const shortDayOfWeek = dayNameMapping[dayOfWeek];
      dayCounts[shortDayOfWeek].total++;
      if (leave.status === "APPROVED") dayCounts[shortDayOfWeek].approved++;
      else if (leave.status === "PENDING") dayCounts[shortDayOfWeek].pending++;
      else if (leave.status === "REJECTED")
        dayCounts[shortDayOfWeek].rejected++;
    });

    const todayApproved = todayLeaves.filter(
      (leave) => leave.status === "APPROVED"
    );
    const todayPending = todayLeaves.filter(
      (leave) => leave.status === "PENDING"
    );
    const todayRejected = todayLeaves.filter(
      (leave) => leave.status === "REJECTED"
    );

    const approvedLeaveCount = todayApproved.length;
    const pendingLeaveCount = todayPending.length;
    const rejectedLeaveCount = todayRejected.length;
    const totalLeaveCount = todayLeaves.length;
    // const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1); // Set the date to the previous day

    // Start of yesterday
    const startOfYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
      0,
      0,
      0
    );

    // End of yesterday
    const endOfYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
      23,
      59,
      59
    );

    const yesterdayLeaves = await prisma.leaveApplication.findMany({
      where: {
        createdAt: { gte: startOfYesterday, lt: endOfYesterday },
      },
    });

    const yesterdayTotalCount = yesterdayLeaves.length;
    const todayLeavesCounts = todayLeaves.length;

    let percentageChange = 0; // Initialize as null

    if (yesterdayTotalCount !== 0) {
      percentageChange =
        ((todayLeavesCounts - yesterdayTotalCount) / yesterdayTotalCount) * 100;
      percentageChange = parseFloat(percentageChange.toFixed(1));
      percentageChange = Math.min(percentageChange, 100);
      percentageChange = Math.max(percentageChange, 0);
    } else {
      if (todayLeavesCounts !== 0) {
        percentageChange =
          ((todayLeavesCounts - yesterdayTotalCount) / yesterdayTotalCount) *
          100;
        percentageChange = parseFloat(percentageChange.toFixed(1));
        percentageChange = Math.min(percentageChange, 100);
        percentageChange = Math.max(percentageChange, 0);
      }
      // If both yesterdayTotalCount and todayLeavesCounts are 0, percentageChange remains 0.
    }

    return res.status(200).json({
      weekCounts: dayCounts,
      totalLeaves: totalLeaveCount,
      totalApproved: approvedLeaveCount,
      totalPending: pendingLeaveCount,
      totalRejected: rejectedLeaveCount,
      // todayTotal: todayTotalCount,
      yesterdayTotal: yesterdayTotalCount,
      percentageChange: percentageChange,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
const yearlyLeaveState = async (req, res) => {
  try {
    const date = new Date();
    const currentMonth = date.getUTCMonth() + 1;
    const monthCounts = [];

    for (let month = 1; month <= currentMonth; month++) {
      const currentMonthStart = new Date(
        date.getFullYear(),
        month - 1,
        1,
        0,
        0,
        0
      );

      // Adjust the calculation of currentMonthEnd to represent the end of the current month
      const currentMonthEnd = new Date(
        date.getFullYear(),
        month,
        0,
        23,
        59,
        59
      );

      const monthlyLeaves = await prisma.leaveApplication.findMany({
        where: {
          createdAt: { gte: currentMonthStart, lt: currentMonthEnd },
          status: { in: ["APPROVED", "REJECTED"] },
        },
      });

      const monthCount = {
        month: new Date(currentMonthStart).toLocaleString("en-us", {
          month: "short",
        }),
        approved: 0,
        rejected: 0,
      };

      monthlyLeaves.forEach((leave) => {
        if (leave.status === "APPROVED") monthCount.approved++;
        else if (leave.status === "REJECTED") monthCount.rejected++;
      });

      monthCounts.push(monthCount);
    }

    return res.status(200).json({
      yearCounts: monthCounts,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
const MonthlyApprovedLeaves = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res
        .status(400)
        .json({ message: "Date parameter is missing in the query" });
    }

    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1); // Calculate the next day

    const approvedLeave = await prisma.leaveApplication.findMany({
      where: {
        status: "APPROVED",
        AND: [
          {
            leaveFrom: { lte: endDate },
          },
          {
            leaveTo: { gte: startDate },
          },
        ],
      },
      orderBy: [
        {
          id: "desc",
        },
      ],
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true,
          },
        },
      },
    });

    const approvedLeaveWithStartDateArray = approvedLeave.map((item) => {
      return {
        ...item,
        startDate: startDate, // Include start date array for each leave
      };
    });

    return res.status(200).json({
      approvedLeave: approvedLeaveWithStartDateArray,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getAllLeave = async (req, res) => {

  let users = [];
  console.log(req.query.userId, "req")
  var userId = req.query.userId
  try {
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ message: "Invalid userId provided" });
    }
    console.log()

    const fetchUsers = async (referenceId, userIdToExclude) => {
      const users = await prisma.user.findMany({
        where: {
          OR: [{ reference_id: Number(referenceId) }, { referenceid_two: Number(referenceId) }],
        },
      });

      const linkedUsers = await Promise.all(
        users.map(async (user) => {
          let dd = await fetchUsers(user.id);
          dd.push(user);
          return dd;
        })
      );

      return linkedUsers.flat();
    };

    const usersData = await fetchUsers(req.query.userId);
    console.log(usersData, "usersData")
    let array = [];
    for (let x of usersData) {
      array.push(x.id);
    }
    console.log(array);
    const { skip, limit, status, employeeId } = req.query;
    const leave = await prisma.leaveApplication.findMany({
      where: {
        userId: { in: array },
        status: status,
        user: {
          employeeId: employeeId,
        },
      },
      orderBy: [
        {
          id: "desc",
        },
      ],
      include: {
        leaveApplication: {
          where: {
            status: status,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userName: true,
            employeeId: true,
            roleId: true,
            department: true,
          },
        },
      },
    });

    return res.status(200).json(
      leave
      // array
    );
  } catch (error) {
    console.log(error )
    return res.status(400).json({ message: error.message });
  }
};

function sendnotifiy(Title, Body, Desc, Token) {
  try {
    const message = {
      notification: {
        title: Title,
        body: Body,
      },
      token: Token,
    };
    admin
      .messaging()
      .send(message)
      .then((response) => {
        console.log("Notification Send ....");
      })
      .catch((error) => {
        console.log("Error sending notification:", error);
      });
  } catch (error) {
    console.log("Error:", error);
  }
}
module.exports = {
  createSingleLeave,
  getAllLeave,
  getSingleLeave,
  grantedLeave,
  getLeaveByUserId,
  deleteSingleLeave,
  adminSingleLeave,
  getapprovedAllLeave,
  todayLeaveState,
  yearlyLeaveState,
  MonthlyApprovedLeaves,
  // getAllLeaveCTO
};
