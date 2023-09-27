const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

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
     
      const leaveFrom = new Date(req.body.leaveFrom);
      // leaveFrom.setHours(0,0,0,0)
      const leaveTo = new Date(req.body.leaveTo);
      leaveTo.setHours(23,59,59,59)
      const user = await prisma.user.findUnique({
        where: {
          id: parseInt(req.body.userId),
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
        return res.status(400).json({ message: "Already 2 leaves approved for this day." });
      }
  

      if ([0, 1, 8].includes(leaveFrom.getMonth())) {
        return res.status(400).json({ message: "Leave not allowed in Jan,Feb, or Sep." });
      }
      var Difference_In_Time = leaveTo.getTime() - leaveFrom.getTime(); 
           
      var leaveDuration = Math.round(Difference_In_Time / (1000 * 3600 * 24));
  if (leaveFrom.toDateString() === leaveTo.toDateString()) {
    // Single-day leave
    if (req.body.daytype === 'FULL') {
      leaveDuration = leaveDuration; // One-day full leave
    } else if (req.body.daytype === 'HALF') {
      leaveDuration =leaveDuration/2; // One-day half leave
    }
  } else {
    if (req.body.daytype === 'HALF') {
      leaveDuration = leaveDuration / 2; // Adjust for half-day leave
    }
  }
      if (user.remainingannualallowedleave < leaveDuration) {
        return res.status(400).json({ message: "Not enough remaining annual leave." });
      }
      let todayDate = new Date();
      var Difference_In_Time2 = leaveFrom.getTime() - todayDate.getTime();    
      var Difference_In_Days = Math.round(Difference_In_Time2 / (1000 * 3600 * 24));
      const submitDays = leaveDuration === 1 || leaveDuration === 0.5 ? 3 : 
                  leaveDuration === 2 || leaveDuration === 1 ? 5 : 
                  leaveDuration === 3 || leaveDuration === 1.5 ? 7 : 
                  leaveDuration === 4 || leaveDuration === 2 ? 9 : 
                  leaveDuration === 5|| leaveDuration === 2.5 ? 11 : 
                  leaveDuration === 6 || leaveDuration ===3 ? 13 : 
                  leaveDuration === 7 || leaveDuration === 3.5 ? 15 : 
                  leaveDuration === 8 || leaveDuration ===4 ? 17 : 
                  leaveDuration === 9 || leaveDuration ===4.5 ? 19 : 
                  leaveDuration === 10 || leaveDuration === 5 ? 21 : 
                  leaveDuration === 11 || leaveDuration ===5.5 ? 23 : 
                  leaveDuration === 12 || leaveDuration ===6 ? 25 : 
                  leaveDuration === 13 || leaveDuration === 6.5 ? 27 : 
                  leaveDuration === 14|| leaveDuration ===7 ? 29 : 
                  leaveDuration === 15 || leaveDuration === 7.5 ? 31 : 
                  leaveDuration === 16 || leaveDuration ===8 ? 33 : 
                  leaveDuration === 17 || leaveDuration ===8.5 ? 35 : 
                  leaveDuration === 18 || leaveDuration ===9 ? 37 : 
                  leaveDuration === 19 || leaveDuration === 9.5 ? 39 : 
                  leaveDuration === 20|| leaveDuration ===10 ? 41 : 0;
      if (Difference_In_Days < submitDays){
        return res.status(400).json({ message: `You must apply at least ${submitDays} days before the leave date.` });
      }
      const existingLeave = await prisma.leaveApplication.findFirst({
        where: {
          userId: parseInt(req.body.userId),
          leaveFrom: { lte: leaveTo },
          leaveTo: { gte: leaveFrom },
          status: "APPROVED"
        },
      });

      if (existingLeave) {
        return res.status(400).json({ message: "Your leave already approved this day." });
      }
      const leaveType = req.body.leaveType; // Get the leaveType from the request

let leavecategory;
      if (
        leaveType === 'CompassionateLeave(deductible)' ||
        leaveType === 'BereavementLeave(deductible)' ||
        leaveType === 'ParentalLeave(deductible)' ||
        leaveType === 'PaternityLeave(deductible-if-paid)'
      ) {
        leavecategory = 'paid'; // Set leavecategory to 'paid'
      } else {
        leavecategory = 'unpaid'; // Set leavecategory to 'unpaid'
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
          attachment:req.body.attachment ? req.body.attachment:null,
        },
      });  
      console.log(createdLeave);

      if (req.body.daytype==='HALF'){
        leaveDuration = leaveDuration;
      }
      let remainingannualallowedleave = (user.remainingannualallowedleave - leaveDuration).toString();
      
      
      if (req.body.leaveType === 'CompassionateLeave(deductible)'||req.body.leaveType === 'BereavementLeave(deductible)'||req.body.leaveType === 'ParentalLeave(deductible)'||req.body.leaveType === 'PaternityLeave(deductible-if-paid)'){
        await prisma.user.update({
          where: {
            id: parseInt(req.body.userId),
          },
          data: {
            remainingannualallowedleave: remainingannualallowedleave,
          },
        });
      }
      
      
      return res.status(200).json({createdLeave,
      message:"Leave application apply successfully"});
    } catch (error) {
      return res.status(400).json({message: error.message});
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
      leaveTo.setHours(23,59,59,59)
  
        const user = await prisma.user.findUnique({
          where: {
            employeeId:req.body.employeeId,
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
          return res.status(400).json({ message: "Already 2 leaves approved for this day." });
        }
    
  
        if ([0, 1, 8].includes(leaveFrom.getMonth())) {
          return res.status(400).json({ message: "Leave not allowed in Jan,Feb, or Sep." });
        }
        var Difference_In_Time = leaveTo.getTime() - leaveFrom.getTime(); 
           
        var leaveDuration = Math.round(Difference_In_Time / (1000 * 3600 * 24));
    if (leaveFrom.toDateString() === leaveTo.toDateString()) {
      // Single-day leave
      if (req.body.daytype === 'FULL') {
        leaveDuration = leaveDuration; // One-day full leave
      } else if (req.body.daytype === 'HALF') {
        leaveDuration =leaveDuration/2; // One-day half leave
      }
    } else {
      if (req.body.daytype === 'HALF') {
        leaveDuration = leaveDuration / 2; // Adjust for half-day leave
      }
    }
        if (user.remainingannualallowedleave < leaveDuration) {
          return res.status(400).json({ message: "Not enough remaining annual leave." });
        }
        let todayDate = new Date();
        var Difference_In_Time2 = leaveFrom.getTime() - todayDate.getTime();    
        var Difference_In_Days = Math.round(Difference_In_Time2 / (1000 * 3600 * 24));
        const submitDays = leaveDuration === 1 || leaveDuration === 0.5 ? 3 : 
        leaveDuration === 2 || leaveDuration === 1 ? 5 : 
        leaveDuration === 3 || leaveDuration === 1.5 ? 7 : 
        leaveDuration === 4 || leaveDuration === 2 ? 9 : 
        leaveDuration === 5|| leaveDuration === 2.5 ? 11 : 
        leaveDuration === 6 || leaveDuration ===3 ? 13 : 
        leaveDuration === 7 || leaveDuration === 3.5 ? 15 : 
        leaveDuration === 8 || leaveDuration ===4 ? 17 : 
        leaveDuration === 9 || leaveDuration ===4.5 ? 19 : 
        leaveDuration === 10 || leaveDuration === 5 ? 21 : 
        leaveDuration === 11 || leaveDuration ===5.5 ? 23 : 
        leaveDuration === 12 || leaveDuration ===6 ? 25 : 
        leaveDuration === 13 || leaveDuration === 6.5 ? 27 : 
        leaveDuration === 14|| leaveDuration ===7 ? 29 : 
        leaveDuration === 15 || leaveDuration === 7.5 ? 31 : 
        leaveDuration === 16 || leaveDuration ===8 ? 33 : 
        leaveDuration === 17 || leaveDuration ===8.5 ? 35 : 
        leaveDuration === 18 || leaveDuration ===9 ? 37 : 
        leaveDuration === 19 || leaveDuration === 9.5 ? 39 : 
        leaveDuration === 20|| leaveDuration ===10 ? 41 : 0;
  
        console.log(submitDays,"fsgdf");
        if (Difference_In_Days < submitDays){
          return res.status(400).json({ message: `You apply ${submitDays} days before the leave date.` });
        }
        const existingLeave = await prisma.leaveApplication.findFirst({
          where: {
            user: {
              employeeId: (req.body.employeeId).toString()
            },
            leaveFrom: { lte: leaveTo },
            leaveTo: { gte: leaveFrom },
            status: "APPROVED"
          },
        });
        
        if (existingLeave) {
          return res.status(400).json({ message: "User leave is already approved for this day." });
        }
        const leaveType = req.body.leaveType; // Get the leaveType from the request

        let leavecategory;
              if (
                leaveType === 'CompassionateLeave(deductible)' ||
                leaveType === 'BereavementLeave(deductible)' ||
                leaveType === 'ParentalLeave(deductible)' ||
                leaveType === 'PaternityLeave(deductible-if-paid)'
              ) {
                leavecategory = 'paid'; // Set leavecategory to 'paid'
              } else {
                leavecategory = 'unpaid'; // Set leavecategory to 'unpaid'
              }
              let status;

              if (user.roleId === 5) {
                status = 'PENDING';
              } else if (user.roleId === 1 || user.roleId === 6 || user.roleId === 4) {
                status = 'PENDING';
              } else if (user.roleId === 3) {
                status = 'APPROVED';
              } else {
                status = 'PENDING'; // Set a default status if none of the conditions match
              } 
        const createdLeave = await prisma.leaveApplication.create({
          data: {
            user: {
              connect: {
                employeeId:req.body.employeeId,
              },
            },
            acceptLeaveBy: req.auth.sub,
            leaveType:leaveType,
            leavecategory: leavecategory,
            daytype: req.body.daytype,
            fromtime: req.body.fromtime,
            totime: req.body.totime,
            leaveFrom: leaveFrom,
            status:status,
            leaveTo: leaveTo,
            leaveDuration: leaveDuration,
            reason: req.body.reason ? req.body.reason : undefined,
            attachment:req.body.attachment ? req.body.attachment:null,
            // createdAt: submitDate, // Include submitDate inside the data object
          },
        });  
        console.log(createdLeave);
  
        if (req.body.daytype==='HALF'){
          leaveDuration = leaveDuration;
        }
        console.log(leaveDuration);
        let remainingannualallowedleave = (user.remainingannualallowedleave - leaveDuration).toString();
        
        if (req.body.leaveType === 'CompassionateLeave(deductible)'||req.body.leaveType === 'BereavementLeave(deductible)'||req.body.leaveType === 'ParentalLeave(deductible)'||req.body.leaveType === 'PaternityLeave(deductible-if-paid)'){
          await prisma.user.update({
            where: {
              employeeId:req.body.employeeId,
            },
            data: {
              remainingannualallowedleave: remainingannualallowedleave,
            },
          });
        }
        
        return res.status(200).json({createdLeave,
        message:"Leave application apply successfully"});
      } catch (error) {
        return res.status(400).json({message: error.message});
      }
    }
  };
// const getAllLeave = async (req, res) => {
//   const { skip, limit, status } = req.query;

//   let whereClause = {}; // Initialize an empty object for the where clause

//   if (status && status !== "all") {
//     whereClause.status = status; 
//   }
//   if (req.query.query === "all") {
//     const allLeave = await prisma.leaveApplication.findMany({
//       orderBy: [
//         {
//           id: "desc",
//         },
//       ],
//       include: {
//         user: {
//           select: {
//             firstName: true,
//             lastName: true,
//             userName:true,
//             employeeId:true,
//             // role:true,
//             roleId:true,
//             reference_id:true,
//           },
//         },
//       },
//     });
// console.log(allLeave,"kjhj");
//     // get the id and acceptLeaveBy from all leave array
//     const acceptLeaveBy = allLeave.map((item) => {
      
//       return {
//         ...item,
//         acceptLeaveBy: item.acceptLeaveBy,
//       };
//     });

//     // get the acceptLeaveBy from user table and return the firstName and lastName into acceptLeaveBy and if acceptLeaveBy is null then return null into acceptLeaveBy for that object
//     const result = await Promise.all(
//       acceptLeaveBy.map(async (item) => {
//         if (item.acceptLeaveBy) {
//           const acceptLeaveBy = await prisma.user.findUnique({
//             where: {
//               id: item.acceptLeaveBy,
//             },
//             select: {
//               id: true,
//               firstName: true,
//               lastName: true,
//               userName:true,
//             employeeId:true,
//             reference_id:true

//             },
//           });
//           return {
//             ...item,
//             acceptLeaveBy: acceptLeaveBy,
//           };
//         } else {
//           return {
//             ...item,
//             acceptLeaveBy: null,
//           };
//         }
//       })
//     );

//     return res.status(200).json(result);
//   } else {
    // const { skip, limit } = getPagination(req.query);
    // try {
    //   const allLeave = await prisma.leaveApplication.findMany({
        // orderBy: [
        //   {
        //     id: "desc",
        //   },
        // ],
        // skip: Number(skip),
        // take: Number(limit),
        // where: {
        //   status: req.query.status,
        // },
        // include: {
        //   user: {
        //     select: {
        //       firstName: true,
        //       lastName: true,
        //       userName:true,
        //     employeeId:true,
        //     reference_id:true

        //     },
        //   },
        // },
    //   });
//       // get the id and acceptLeaveBy from all leave array
//       const acceptLeaveBy = allLeave.map((item) => {
//         return {
//           ...item,
//           acceptLeaveBy: item.acceptLeaveBy,
//         };
//       });

//       // get the acceptLeaveBy from user table and return the firstName and lastName into acceptLeaveBy and if acceptLeaveBy is null then return null into acceptLeaveBy for that object
//       const result = await Promise.all(
//         acceptLeaveBy.map(async (item) => {
//           if (item.acceptLeaveBy) {
//             const acceptLeaveBy = await prisma.user.findUnique({
//               where: {
//                 id: item.acceptLeaveBy,
//               },
//               select: {
//                 id: true,
//                 firstName: true,
//                 lastName: true,
//                 userName:true,
//             employeeId:true,
//             reference_id:true
//               },
//             });
//             return {
//               ...item,
//               acceptLeaveBy: acceptLeaveBy,
//             };
//           } else {
//             return {
//               ...item,
//               acceptLeaveBy: null,
//             };
//           }
//         })
//       );

//       return res.status(200).json(result);
//     } catch (error) {
//       return res.status(400).json({ message: error.message });
//     }
//   }
// };
const getapprovedAllLeave = async (req, res) => {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0);

    const todayApproved = await prisma.leaveApplication.findMany({
        where: {
        status: 'APPROVED',
        OR: [
          {
            createdAt: { gte: todayStart, lt: todayEnd }
          },
          {
            updatedAt: { gte: todayStart, lt: todayEnd }
          }
        ]
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            userName: true,
            employeeId: true,
            department:true,
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
    const singleLeave = await prisma.leaveApplication.findUnique({
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

    if (
      (req.auth.sub !== singleLeave.userId &&
        !req.auth.permissions.includes("readAll-leaveApplication")) ||
      !req.auth.permissions.includes("readSingle-leaveApplication")
    ) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = {
      ...singleLeave,
      acceptLeaveBy: acceptLeaveBy,
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
    const leaveDuration =existingLeave.leaveDuration

    if (!existingLeave) {
      return res.status(404).json({ message: 'Leave application not found' });
    }

    if (existingLeave.status === 'PENDING' && req.body.status === 'APPROVED') {
      // If status was changed from 'REJECTED' to 'APPROVED', deduct the leave duration from remaining leaves
      const currentRemainingLeaves = parseFloat(existingLeave.user.remainingannualallowedleave);
      await prisma.user.update({
        where: {
          id: existingLeave.user.id,
        },
        data: {
          remainingannualallowedleave: currentRemainingLeaves.toString(),
        },
      });

    } else if (existingLeave.status === 'PENDING' && req.body.status === 'REJECTED') {
      // If status was changed from 'PENDING' to 'REJECTED', add the leave duration back to remaining leaves
      if (existingLeave.leaveDuration) {
        const currentRemainingLeaves = parseFloat(existingLeave.user.remainingannualallowedleave);
        const updatedRemainingLeaves = Math.max(currentRemainingLeaves + existingLeave.leaveDuration, 0);
        await prisma.user.update({
          where: {
            id: existingLeave.user.id,
          },
          data: {
            remainingannualallowedleave: updatedRemainingLeaves.toString(),
          },
        });
      }
    } else if (existingLeave.status === 'APPROVED' && req.body.status === 'REJECTED') {
      // If status was changed from 'APPROVED' to 'REJECTED', add the leave duration back to remaining leaves
      const currentRemainingLeaves = parseFloat(existingLeave.user.remainingannualallowedleave);
      const updatedRemainingLeaves = Math.max(currentRemainingLeaves + existingLeave.leaveDuration, 0);

      await prisma.user.update({
        where: {
          id: existingLeave.user.id,
        },
        data: {
          remainingannualallowedleave: updatedRemainingLeaves.toString(),
        },
      });
    } else if (existingLeave.status === 'REJECTED' && req.body.status === 'APPROVED') {
      // If status was changed from 'REJECTED' to 'APPROVED', deduct the leave duration from remaining leaves
      const currentRemainingLeaves = parseFloat(existingLeave.user.remainingannualallowedleave);
      const updatedRemainingLeaves = Math.max(currentRemainingLeaves - existingLeave.leaveDuration, 0);


      await prisma.user.update({
        where: {
          id: existingLeave.user.id,
        },
        data: {
          remainingannualallowedleave: updatedRemainingLeaves.toString(),
        },
      });
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
        reviewComment: req.body.reviewComment ? req.body.reviewComment : undefined,
        status: req.body.status,
      },
    });

    if (existingLeave.status === 'PENDING' && req.body.status === 'APPROVED') {
      req.body.userId = existingLeave.user.id;
      req.body.grantedLeave = grantedLeave;
      req.body.fromleave = true;
      next();
    }else{
      return res.status(200).json({
        grantedLeave,
        message: 'Application status is updated',
      });
    }

    
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update application status' });
  }
};

const getLeaveByUserId = async (req, res) => {
  try {
    const getLeaveTo = await prisma.leaveApplication.findMany({
      where: {
        AND: {
          userId: Number(req.params.id),
        },
      },
      orderBy: [
        {
          id: "desc",
        },
      ],
    });

    if (getLeaveTo.length === 0)
      return res.status(200).json({ message: "No leave found for this user" });

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

    const currentDate = new Date();

    const leaveStatus = singleLeave.map((leave) => {
      if (leave.leaveTo > currentDate) return "onleave";
      else return "not on leave";
    });

    const totalPendingLeaves = await prisma.leaveApplication.count({
      where: {
        AND: {
          userId: Number(req.params.id),
          status: "PENDING",
        },
      },
    });

    const totalAcceptedLeaves = await prisma.leaveApplication.count({
      where: {
        AND: {
          userId: Number(req.params.id),
          status: "APPROVED",
        },
      },
    });

    const totalRejectedLeaves = await prisma.leaveApplication.count({
      where: {
        AND: {
          userId: Number(req.params.id),
          status: "REJECTED",
        },
      },
    });

    return res.status(200).json({
      singleLeave,
      leaveStatus,
      totalAcceptedLeaves,
      totalRejectedLeaves,
      totalPendingLeaves,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteSingleLeave=async(req, res)=>{
  try {
    const deletedLeaveApplication = await prisma.leaveApplication.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });

    return res.status(200).json({
      deletedLeaveApplication,
      message:"Leave application deleted successfully"
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}
const todayLeaveState = async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Get the start of the current week (Sunday)
    const endOfWeek = new Date(today);
    endOfWeek.setDate(startOfWeek.getDate() + 7); // Get the end of the current week (Sunday of the next week)

    // Get all leaves for the current week
    const weeklyLeaves = await prisma.leaveApplication.findMany({
      where: {
        OR: [
          {
            createdAt: { gte: startOfWeek, lt: endOfWeek },
          },
          {
            updatedAt: { gte: startOfWeek, lt: endOfWeek },
          }
        ]
      },
    });
    const todays = new Date();
    const startOfToday = new Date(todays.getFullYear(), todays.getMonth(), todays.getDate(), 0, 0, 0);
    const endOfToday = new Date(todays.getFullYear(), todays.getMonth(), todays.getDate(), 23, 59, 59);
    
    const todayLeaves = await prisma.leaveApplication.findMany({
      where: {
        createdAt: { gte: startOfToday, lt: endOfToday },
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
      'Monday': 'Mon',
      'Tuesday': 'Tue',
      'Wednesday': 'Wed',
      'Thursday': 'Thu',
      'Friday': 'Fri',
      'Saturday': 'Sat',
      'Sunday': 'Sun',
    };
    
    // Update counts based on leave status and day of the week
    weeklyLeaves.forEach(leave => {
      const dayOfWeek = new Date(leave.createdAt).toLocaleString('en-us', { weekday: 'long' });
      const shortDayOfWeek = dayNameMapping[dayOfWeek];
      dayCounts[shortDayOfWeek].total++;
      if (leave.status === 'APPROVED') dayCounts[shortDayOfWeek].approved++;
      else if (leave.status === 'PENDING') dayCounts[shortDayOfWeek].pending++;
      else if (leave.status === 'REJECTED') dayCounts[shortDayOfWeek].rejected++;
    });
    
    const todayApproved = todayLeaves.filter((leave) => leave.status === 'APPROVED');
    const todayPending = todayLeaves.filter((leave) => leave.status === 'PENDING');
    const todayRejected = todayLeaves.filter((leave) => leave.status === 'REJECTED');

    const approvedLeaveCount = todayApproved.length;
    const pendingLeaveCount = todayPending.length;
    const rejectedLeaveCount = todayRejected.length;
    const totalLeaveCount = todayLeaves.length;
    // const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1); // Set the date to the previous day

// Start of yesterday
const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);

// End of yesterday
const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);

    const yesterdayLeaves = await prisma.leaveApplication.findMany({
      where: {
        createdAt: { gte: startOfYesterday, lt: endOfYesterday },
      },
    });
    
    const yesterdayTotalCount = yesterdayLeaves.length;
    
    let percentageChange = 0;
    
    if (yesterdayTotalCount !== 0) {
      percentageChange = ((approvedLeaveCount - yesterdayTotalCount) / yesterdayTotalCount) * 100;
    } else if (approvedLeaveCount !== 0) {
      percentageChange = 100;
    }

    return res.status(200).json({
      weekCounts: dayCounts,
      totalLeaves: totalLeaveCount,
      totalApproved: approvedLeaveCount,
      totalPending: pendingLeaveCount,
      totalRejected: rejectedLeaveCount,
      // todayTotal: todayTotalCount,
      yesterdayTotal: yesterdayTotalCount,
      percentageChange: percentageChange
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
      const currentMonthStart = new Date(date.getFullYear(), month - 1, 1, 0, 0, 0);
      const nextMonth = month === 12 ? 1 : month + 1; 
      const currentMonthEnd = new Date(date.getFullYear(), nextMonth - 1, 1, 0, 0, 0);
      const monthlyLeaves = await prisma.leaveApplication.findMany({
        where: {
          createdAt: { gte: currentMonthStart, lt: currentMonthEnd },
          status: { in: ['APPROVED', 'REJECTED'] },
        },
      });

      const monthCount = {
        month: new Date(currentMonthStart).toLocaleString('en-us', { month: 'short' }),
        approved: 0,
        rejected: 0,
      };

      monthlyLeaves.forEach(leave => {
        if (leave.status === 'APPROVED') monthCount.approved++;
        else if (leave.status === 'REJECTED') monthCount.rejected++;
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
      return res.status(400).json({ message: "Date parameter is missing in the query" });
    }

    const startDate = new Date(date);

    // Create an array with year, month, and day of the start date
    // const startDateArray = [startDate];

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1); // Calculate the next day

    const approvedLeave = await prisma.leaveApplication.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          {
            leaveFrom: { gte: startDate, lt: endDate }
          },
          {
            leaveTo: { gte: startDate, lt: endDate }
          }
        ]
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
            employeeId:true,
            department:true,
          },
        },
      },
    });

    const approvedLeaveWithStartDateArray = approvedLeave.map((item) => {
      return {
        ...item,
        startDate: startDate,  // Include start date array for each leave
      };
    });

    return res.status(200).json({
      approvedLeave: approvedLeaveWithStartDateArray,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// const getAllLeave = async (req, res) => {
//   const userId = parseInt(req.query.userId); // Parse userId from query params
//   const { skip, limit, status } = req.query;

//   let whereClause = {}; // Initialize an empty object for the where clause

//   if (status && status !== "all") {
//     whereClause.status = status;
//   }

//   try {
//     // Check if userId is a valid number
//     if (isNaN(userId) || userId <= 0) {
//       return res.status(400).json({ message: 'Invalid userId provided' });
//     }

//     // Get the user's reference_id based on the provided userId
//     const user = await prisma.user.findUnique({
//       where: {
//         id: userId,
//       },
//       select: {
//         reference_id: true,
//       },
//     });

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const referenceId = user.reference_id;

//     let leaveApplications;

//     if (req.query.query === "all") {
//       leaveApplications = await prisma.leaveApplication.findMany({
//         orderBy: [{ id: "desc" }],
//         where: {
//           status: whereClause.status,
//           user: {
//             reference_id: referenceId,
//           },
//         },
        // include: {
        //   user: {
        //     select: {
        //       firstName: true,
        //       lastName: true,
        //       userName: true,
        //       employeeId: true,
        //       reference_id: true,
        //     },
        //   },
        // },
//       });
//     }
//      else  {
//       const { skip, limit } = getPagination(req.query);

//       leaveApplications = await prisma.leaveApplication.findMany({
//         orderBy: [{ id: "desc" }],
//         skip: Number(skip),
//         take: Number(limit),
//         where: {
//           status: whereClause.status,
//           user: {
//             reference_id: referenceId,
//           },
//         },
//         include: {
//           user: {
//             select: {
//               firstName: true,
//               lastName: true,
//               userName: true,
//               employeeId: true,
//               reference_id: true,
//             },
//           },
//         },
//       });
//     }

//     return res.status(200).json(leaveApplications);
//   } catch (error) {
//     return res.status(400).json({ message: error.message });
//   }
// };

// const getAllLeave = async (req, res) => {
//   const userId = parseInt(req.query.userId); 
//   const { skip, limit, status } = req.query;

//   try {
//     if (isNaN(userId) || userId <= 0) {
//       return res.status(400).json({ message: 'Invalid userId provided' });
//     }

//     const fetchUsers = async (referenceId, userIdToExclude) => {
//       const users = await prisma.user.findMany({
//         where: {
//           reference_id: referenceId,
//           NOT: {
//             id: userIdToExclude,
//           },
//         },
//         include: {
//           leaveApplication: {
//             where: {
//               status: status,
//             },
//           },
//         },
        
//       });
    
//       const linkedUsers = await Promise.all(
//         users.map(async (user) => {
//           return {
//             user: user,
//             linkedUsers: await fetchUsers(user.id)
//           };
//         })
//       );
    
//       return linkedUsers.flat();
//     };
    
    

//     const user = await prisma.user.findUnique({
//       where: {
//         id: userId,
//       },
//       select: {
//         reference_id: true,
//       },
//     });

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const referenceId = user.reference_id;

//     const usersData = await fetchUsers(referenceId);

//     return res.status(200).json(usersData);
//   } catch (error) {
//     return res.status(400).json({ message: error.message });
//   }
// };

const getAllLeave = async (req, res) => {
  const userId = parseInt(req.query.userId); 
  const { skip, limit, status } = req.query;

  let users = [];

  try {
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid userId provided' });
    }
    const fetchUsers = async (referenceId, userIdToExclude) => {
      const users = await prisma.user.findMany({
        where: {
          reference_id: referenceId,
          // NOT: {
          //   id: userIdToExclude,
          // },
        },
        include: {
            leaveApplication: {
            where: {
              status: status,
            },
          },
        },
        
      });
    
      const linkedUsers = await Promise.all(
        users.map(async (user) => {

            let dd = await fetchUsers(user.id);
            dd.push(user);
            return dd;

            return array;
            
            
        })
      );
    
      return linkedUsers.flat();
    };
    const usersData = await fetchUsers(userId);
    let array = [];
    for (let x of usersData){
      array.push(x.id);
    }
    console.log(array);

    const leave = await prisma.leaveApplication.findMany({
      where: {
        userId: { in: array }
      },
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
            employeeId: true,
            department: true,
          },
        },
      },
      
    });


    
    return res.status(200).json(
      leave,
      // array
      );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};



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
