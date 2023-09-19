const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");
//create a new employee
// const createSingleLeave = async (req, res) => {
//   if (req.query.query === "deletemany") {
//     try {
//       // delete many designation at once
//       const deletedLeave = await prisma.leaveApplication.deleteMany({
//         where: {
//           id: {
//             in: req.body,
//           },
//         },
//       });
//       return res.status(200).json(deletedLeave);
//     } catch (error) {
//       return res.status(400).json({ message: error.message });
//     }
//   } else {
//     try {
//       // create single designation from an object
//       const leaveFrom = new Date(req.body.leaveFrom);
//       const leaveTo = new Date(req.body.leaveTo);
//       const leaveDuration = Math.round(
//         (leaveTo.getTime() - leaveFrom.getTime()) / (1000 * 60 * 60 * 24)
//       );
//       const createdLeave = await prisma.leaveApplication.create({
//         data: {
//           user: {
//             connect: {
//               id: parseInt(req.body.userId),
//             },
//           },
//           leaveType: req.body.leaveType,
//           leaveFrom: leaveFrom,
//           leaveTo: leaveTo,
//           leaveDuration: leaveDuration,
//           reason: req.body.reason ? req.body.reason : undefined,
//         },
//       });

//       return res.status(200).json(createdLeave);
//     } catch (error) {
//       return res.status(400).json({ message: error.message });
//     }
//   }
// };

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
      const leaveTo = new Date(req.body.leaveTo);
      const user = await prisma.user.findUnique({
        where: {
          id: parseInt(req.body.userId),
        },
      });
  
      if (!user) {
        return res.status(400).json({ message: "User not found." });
      }
      const overlappingLeave = await prisma.leaveApplication.findFirst({
        where: {
          user: {
            NOT: {
              id: parseInt(req.body.userId),
            },
          },
          leaveFrom: { lte: leaveTo },
          leaveTo: { gte: leaveFrom },
          status: "APPROVED",
        },
      });
      if (overlappingLeave) {
        return res.status(400).json({ message: "Already two leave applications accepted" });
      }
  

      if ([0, 1, 3].includes(leaveFrom.getMonth())) {
        return res.status(400).json({ message: "Leave not allowed in January, February, or April." });
      }

      // const leaveDuration = Math.round(
      //   (leaveTo.getTime() - leaveFrom.getTime()) / (1000 * 60 * 60 * 24)
      // );
      let leaveDuration;
        if (req.body.daytype === 'FULL') {
            leaveDuration = Math.round((leaveTo.getTime() - leaveFrom.getTime()) / (1000 * 60 * 60 * 24));
        } else if (req.body.daytype === 'HALF') {
            leaveDuration = 0.5; // Half-day
        }
      if (user.remainingannualallowedleave < leaveDuration) {
        return res.status(400).json({ message: "Not enough remaining annual leave." });
      }


      let submitDate = new Date(leaveFrom);
      const submitDays = leaveDuration === 1 ? 3 : leaveDuration === 2 ? 5 : leaveDuration === 3 ? 7 :leaveDuration === 4 ? 9:leaveDuration === 5 ? 11 :leaveDuration === 6 ? 13:leaveDuration === 7 ? 15
      :leaveDuration === 8 ? 17 :leaveDuration === 9 ? 19 :leaveDuration === 10 ? 21 : leaveDuration === 11 ? 23 :leaveDuration === 12 ? 25 :leaveDuration === 13 ? 27 :leaveDuration === 14 ? 29 :leaveDuration === 15 ? 31 :leaveDuration === 16 ? 33 :leaveDuration === 17 ? 35 :leaveDuration === 18 ? 37 :
      leaveDuration === 19 ? 39 :leaveDuration === 20 ? 41  : 0;

      if (submitDays > 0) {
        submitDate.setDate(leaveFrom.getDate() - submitDays);
        if (submitDate.getTime() < new Date().getTime()) {
          return res.status(400).json({ message: `You must apply at least ${submitDays} days before the leave date.` });
        }
      }

      // let submitDate;

      // if (leaveDuration === 1) {
      //   // If it's a 1-day leave, check if submitDate is at least 3 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 3);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 3 days before the leave date." });
      //   }
      // } else if (leaveDuration === 2) {
      //   // If it's a 2-day leave, check if submitDate is at least 5 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 5);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 5 days before the leave date." });
      //   }
      // }
      // else if (leaveDuration === 3) {
      //   // If it's a 2-day leave, check if submitDate is at least 5 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 7);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 7 days before the leave date." });
      //   }
      // }
      // else if (leaveDuration === 4) {
      //   // If it's a 2-day leave, check if submitDate is at least 5 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 9);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 9 days before the leave date." });
      //   }
      // }
      // else if (leaveDuration === 5) {
      //   // If it's a 2-day leave, check if submitDate is at least 5 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 11);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 11 days before the leave date." });
      //   }
      // }
      // else if (leaveDuration === 6) {
      //   // If it's a 2-day leave, check if submitDate is at least 5 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 13);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 13 days before the leave date." });
      //   }
      // }
      // else if (leaveDuration === 7) {
      //   // If it's a 2-day leave, check if submitDate is at least 5 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 15);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 15 days before the leave date." });
      //   }
      // }
      // else if (leaveDuration === 8) {
      //   // If it's a 2-day leave, check if submitDate is at least 5 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 17);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 17 days before the leave date." });
      //   }
      // }
      // else if (leaveDuration === 9) {
      //   // If it's a 2-day leave, check if submitDate is at least 5 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 19);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 19 days before the leave date." });
      //   }
      // }
      // else if (leaveDuration === 10) {
      //   // If it's a 2-day leave, check if submitDate is at least 5 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 21);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 21 days before the leave date." });
      //   }
      // }
      // else if (leaveDuration === 11) {
      //   // If it's a 2-day leave, check if submitDate is at least 5 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 23);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 23 days before the leave date." });
      //   }
      // }
      // else if (leaveDuration === 12) {
      //   // If it's a 2-day leave, check if submitDate is at least 5 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 25);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 25 days before the leave date." });
      //   }
      // }
      // else if (leaveDuration === 13) {
      //   // If it's a 2-day leave, check if submitDate is at least 5 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 27);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 27 days before the leave date." });
      //   }
      // }
      // else if (leaveDuration === 14) {
      //   // If it's a 2-day leave, check if submitDate is at least 5 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 29);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 29 days before the leave date." });
      //   }
      // }
      // else if (leaveDuration === 15) {
      //   // If it's a 2-day leave, check if submitDate is at least 5 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 31);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 31 days before the leave date." });
      //   }
      // }
      // else if (leaveDuration === 16) {
      //   // If it's a 2-day leave, check if submitDate is at least 5 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 33);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 33 days before the leave date." });
      //   }
      // }
      // else if (leaveDuration === 17) {
      //   // If it's a 2-day leave, check if submitDate is at least 5 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 35);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 35 days before the leave date." });
      //   }
      // }
      // else if (leaveDuration === 18) {
      //   // If it's a 2-day leave, check if submitDate is at least 5 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 37);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 37 days before the leave date." });
      //   }
      // }
      // else if (leaveDuration === 19) {
      //   // If it's a 2-day leave, check if submitDate is at least 5 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 39);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 39 days before the leave date." });
      //   }
      // }
      // else if (leaveDuration === 20) {
      //   // If it's a 2-day leave, check if submitDate is at least 5 days before leaveFrom
      //   submitDate = new Date(leaveFrom);
      //   submitDate.setDate(leaveFrom.getDate() - 41);
      
      //   if (submitDate.getTime() < new Date().getTime()) {
      //     return res.status(400).json({ message: "You must apply at least 41 days before the leave date." });
      //   }
      // }
      //  else {
      //   return res.status(400).json({ message: "Invalid leave duration." });
      // }
      
      const createdLeave = await prisma.leaveApplication.create({
        data: {
          user: {
            connect: {
              id: parseInt(req.body.userId),
            },
          },
          leaveType: req.body.leaveType,
          leavecategory: req.body.leavecategory,
          daytype: req.body.daytype,
          fromtime: req.body.fromtime,
          totime: req.body.totime,
          leaveFrom: leaveFrom,
          leaveTo: leaveTo,
          leaveDuration: leaveDuration,
          reason: req.body.reason ? req.body.reason : undefined,
          createdAt: submitDate, // Include submitDate inside the data object
        },
      });  
      console.log(createdLeave);

      let remainingannualallowedleave = (user.remainingannualallowedleave - leaveDuration).toString();
      let remainingannualallowedleaveun = (user.remainingannualallowedleave).toString();
      let remaninghalf=(parseFloat(user.remainingannualallowedleave) - 0.5).toString();;

    if (req.body.leavecategory === 'PAID'&& req.body.daytype==='FULL') {
      await prisma.user.update({
        where: {
          id: parseInt(req.body.userId),
        },
        data: {
          remainingannualallowedleave: remainingannualallowedleave,
        },
      }) 
    } 
    else if(req.body.leavecategory === 'PAID' && req.body.daytype==='HALF')
    {
      await prisma.user.update({
        where: {
          id: parseInt(req.body.userId),
        },
        data: {
          remainingannualallowedleave: remaninghalf,
        },
      }) 
    }
    else{
      remainingannualallowedleaveun=remainingannualallowedleaveun

    }
      return res.status(200).json(createdLeave);
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
        const leaveTo = new Date(req.body.leaveTo);
        if (leaveTo < leaveFrom) {
          return res.status(400).json({ message: "LeaveTo  date cannot be earlier than leaveFrom date." });
        }
        const user = await prisma.user.findUnique({
          where: {
            employeeId:req.body.employeeId,
          },
        });
    console.log(user);
        if (!user) {
          return res.status(400).json({ message: "User not found." });
        }
        const overlappingLeave = await prisma.leaveApplication.findFirst({
          where: {
            user: {
              NOT: {
                employeeId:req.body.employeeId,
              },
            },
            leaveFrom: { lte: leaveTo },
            leaveTo: { gte: leaveFrom },
            status: "APPROVED",
          },
        });
        if (overlappingLeave) {
          return res.status(400).json({ message: "Already two leave applications accepted" });
        }
        if ([0, 1, 3].includes(leaveFrom.getMonth())) {
          return res.status(400).json({ message: "Leave not allowed in January, February, or April." });
        }
  
        // const leaveDuration = Math.round(
        //   (leaveTo.getTime() - leaveFrom.getTime()) / (1000 * 60 * 60 * 24)
        // );
        let leaveDuration;
        if (req.body.daytype === 'FULL') {
            leaveDuration = Math.round((leaveTo.getTime() - leaveFrom.getTime()) / (1000 * 60 * 60 * 24));
        } else if (req.body.daytype === 'HALF') {
            leaveDuration = 0.5; // Half-day
        }
        
        if (user.remainingannualallowedleave < leaveDuration) {
          return res.status(400).json({ message: "Not enough remaining annual leave." });
        }
  
  
        let submitDate = new Date(leaveFrom);
        const submitDays = leaveDuration === 1 ? 3 : leaveDuration === 2 ? 5 : leaveDuration === 3 ? 7 :leaveDuration === 4 ? 9:leaveDuration === 5 ? 11 :leaveDuration === 6 ? 13:leaveDuration === 7 ? 15
        :leaveDuration === 8 ? 17 :leaveDuration === 9 ? 19 :leaveDuration === 10 ? 21 : leaveDuration === 11 ? 23 :leaveDuration === 12 ? 25 :leaveDuration === 13 ? 27 :leaveDuration === 14 ? 29 :leaveDuration === 15 ? 31 :leaveDuration === 16 ? 33 :leaveDuration === 17 ? 35 :leaveDuration === 18 ? 37 :
        leaveDuration === 19 ? 39 :leaveDuration === 20 ? 41  : 0;
  
        if (submitDays > 0) {
          submitDate.setDate(leaveFrom.getDate() - submitDays);
          if (submitDate.getTime() < new Date().getTime()) {
            return res.status(400).json({ message: `You must apply at least ${submitDays} days before the leave date.` });
          }
        }      
        const createdLeave = await prisma.leaveApplication.create({
          data: {
            user: {
              connect: {
                employeeId:req.body.employeeId,
              },
            },
            leaveType: req.body.leaveType,
            leavecategory: req.body.leavecategory,
            daytype: req.body.daytype,
            fromtime: req.body.fromtime,
            totime: req.body.totime,
            status:'APPROVED',
            leaveFrom: leaveFrom,
            leaveTo: leaveTo,
            leaveDuration: leaveDuration,
            reason: req.body.reason ? req.body.reason : undefined,
            createdAt: submitDate, // Include submitDate inside the data object
          },
        });  
        console.log(createdLeave);
  
        let remainingannualallowedleave = (user.remainingannualallowedleave - leaveDuration).toString();
        let remainingannualallowedleaveun = (parseFloat(user.remainingannualallowedleave) - 0.5).toString();
        let remaninghalf=(user.remainingannualallowedleave-0.5).toString();
  
      if (req.body.leavecategory === 'PAID'&& req.body.daytype==='FULL') {
        await prisma.user.update({
          where: {
            employeeId:req.body.employeeId,
          },
          data: {
            remainingannualallowedleave: remainingannualallowedleave,
          },
        }) 
      } 
      else if(req.body.leavecategory === 'PAID' && req.body.daytype==='HALF')
      {
        await prisma.user.update({
          where: {
            employeeId:req.body.employeeId,
          },
          data: {
            remainingannualallowedleave: remaninghalf,
          },
        }) 
      }
      else{
        remainingannualallowedleaveun=remainingannualallowedleaveun
  
      }
        return res.status(200).json(createdLeave);
      } catch (error) {
        return res.status(400).json({message: error.message});
      }
    }
  };
  
  



// const createSingleLeave = async (req, res) => {
//   if (req.query.query === "deletemany") {
//     try {
//       // delete many designations at once
//       const deletedLeave = await prisma.leaveApplication.deleteMany({
//         where: {
//           id: {
//             in: req.body,
//           },
//         },
//       });
//       return res.status(200).json(deletedLeave);
//     } catch (error) {
//       return res.status(400).json({ message: error.message });
//     }
//   } else {
//     try {
//       const leaveFrom = new Date(req.body.leaveFrom);
//       const leaveTo = new Date(req.body.leaveTo);
//       const user = await prisma.user.findUnique({
//         where: {
//           id: parseInt(req.body.userId),
//         },
//       });

//       if (!user) {
//         return res.status(400).json({ message: "User not found." });
//       }

//       const overlappingLeave = await prisma.leaveApplication.findFirst({
//         where: {
//           user: {
//             NOT: {
//               id: parseInt(req.body.userId),
//             },
//           },
//           leaveFrom: { lte: leaveTo },
//           leaveTo: { gte: leaveFrom },
//           status: "ACCEPTED",
//         },
//       });

//       if (overlappingLeave) {
//         return res.status(400).json({ message: "Already two leave applications accepted" });
//       }

//       if ([0, 1, 3].includes(leaveFrom.getMonth())) {
//         return res.status(400).json({ message: "Leave not allowed in January, February, or April." });
//       }

//       let leaveDuration;

//       if (req.body.daytype === "full") {
//         leaveDuration = Math.round((leaveTo.getTime() - leaveFrom.getTime()) / (1000 * 60 * 60 * 24));
//       } else if (req.body.daytype === "half") {
//         leaveDuration = 0.5; // Half-day leave
//       } else {
//         return res.status(400).json({ message: "Invalid leave type." });
//       }

//       if (user.remainingannualallowedleave < leaveDuration) {
//         return res.status(400).json({ message: "Not enough remaining annual leave." });
//       }

//       // Calculate submitDate based on leaveDuration
//       let submitDate = new Date(leaveFrom);
//       const submitDays = leaveDuration === 1 ? 3 : leaveDuration === 2 ? 5 : leaveDuration === 3 ? 7 :leaveDuration === 4 ? 9  : 0;

//       if (submitDays > 0) {
//         submitDate.setDate(leaveFrom.getDate() - submitDays);
//         if (submitDate.getTime() < new Date().getTime()) {
//           return res.status(400).json({ message: `You must apply at least ${submitDays} days before the leave date.` });
//         }
//       }

//       const createdLeave = await prisma.leaveApplication.create({
//         data: {
//           user: {
//             connect: {
//               id: parseInt(req.body.userId),
//             },
//           },
//           leaveType: req.body.leaveType,
//           leavecategory: req.body.leavecategory,
//           daytype: req.body.daytype,
//           fromtime: req.body.fromtime,
//           totime: req.body.totime,
//           leaveFrom: leaveFrom,
//           leaveTo: leaveTo,
//           leaveDuration: leaveDuration,
//           reason: req.body.reason ? req.body.reason : undefined,
//           createdAt: submitDate, // Include submitDate inside the data object
//         },
//       });

//       let remainingannualallowedleave = (user.remainingannualallowedleave - leaveDuration).toString();
//       let remainingannualallowedleaveun = user.remainingannualallowedleave.toString();

//       if (req.body.leavecategory === 'PAID') {
//         await prisma.user.update({
//           where: {
//             id: parseInt(req.body.userId),
//           },
//           data: {
//             remainingannualallowedleave: remainingannualallowedleave,
//           },
//         });
//       } else {
//         remainingannualallowedleaveun = remainingannualallowedleaveun;
//       }

//       return res.status(200).json(createdLeave);
//     } catch (error) {
//       return res.status(400).json({ message: error.message });
//     }
//   }
// };







const getAllLeave = async (req, res) => {
  const { skip, limit, status } = req.query;

  let whereClause = {}; // Initialize an empty object for the where clause

  if (status && status !== "all") {
    whereClause.status = status; 
  }
  if (req.query.query === "all") {
    const allLeave = await prisma.leaveApplication.findMany({
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
            userName:true,
            employeeId:true,
          },
        },
      },
    });

    // get the id and acceptLeaveBy from all leave array
    const acceptLeaveBy = allLeave.map((item) => {
      return {
        ...item,
        acceptLeaveBy: item.acceptLeaveBy,
      };
    });

    // get the acceptLeaveBy from user table and return the firstName and lastName into acceptLeaveBy and if acceptLeaveBy is null then return null into acceptLeaveBy for that object
    const result = await Promise.all(
      acceptLeaveBy.map(async (item) => {
        if (item.acceptLeaveBy) {
          const acceptLeaveBy = await prisma.user.findUnique({
            where: {
              id: item.acceptLeaveBy,
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userName:true,
            employeeId:true,
            },
          });
          return {
            ...item,
            acceptLeaveBy: acceptLeaveBy,
          };
        } else {
          return {
            ...item,
            acceptLeaveBy: null,
          };
        }
      })
    );

    return res.status(200).json(result);
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allLeave = await prisma.leaveApplication.findMany({
        orderBy: [
          {
            id: "desc",
          },
        ],
        skip: Number(skip),
        take: Number(limit),
        where: {
          status: req.query.status,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              userName:true,
            employeeId:true,
            },
          },
        },
      });
      // get the id and acceptLeaveBy from all leave array
      const acceptLeaveBy = allLeave.map((item) => {
        return {
          ...item,
          acceptLeaveBy: item.acceptLeaveBy,
        };
      });

      // get the acceptLeaveBy from user table and return the firstName and lastName into acceptLeaveBy and if acceptLeaveBy is null then return null into acceptLeaveBy for that object
      const result = await Promise.all(
        acceptLeaveBy.map(async (item) => {
          if (item.acceptLeaveBy) {
            const acceptLeaveBy = await prisma.user.findUnique({
              where: {
                id: item.acceptLeaveBy,
              },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                userName:true,
            employeeId:true,
              },
            });
            return {
              ...item,
              acceptLeaveBy: acceptLeaveBy,
            };
          } else {
            return {
              ...item,
              acceptLeaveBy: null,
            };
          }
        })
      );

      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
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
            employeeId:true,
          },
        },
      },
    });

    if (!singleLeave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    const acceptLeaveBy = await prisma.user.findUnique({
      where: {
        id: singleLeave.id,
      },
      select: {
        firstName: true,
        lastName: true,
        userName:true,
            employeeId:true,
      },
    });

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
// const grantedLeave = async (req, res) => {
//   try {
//     const acceptLeaveFrom = new Date(req.body.acceptLeaveFrom);
//     const acceptLeaveTo = new Date(req.body.acceptLeaveTo);
//     const leaveDuration = Math.round(
//       (acceptLeaveTo.getTime() - acceptLeaveFrom.getTime()) /
//         (1000 * 60 * 60 * 24)
//     );
//     const grantedLeave = await prisma.leaveApplication.update({
//       where: {
//         id: Number(req.params.id),
//       },
//       data: {
//         acceptLeaveBy: req.auth.sub,
//         acceptLeaveFrom: acceptLeaveFrom ? acceptLeaveFrom : undefined,
//         acceptLeaveTo: acceptLeaveTo ? acceptLeaveTo : undefined,
//         leaveDuration: leaveDuration ? leaveDuration : 0,
//         reviewComment: req.body.reviewComment
//           ? req.body.reviewComment
//           : undefined,
//         status: req.body.status,
//       },
//     });
//     return res.status(200).json(grantedLeave);
//   } catch (error) {
//     return res.status(400).json({ message: error.message });
//   }
// };
const grantedLeave = async (req, res) => {
  try {
    const acceptLeaveFrom = new Date(req.body.acceptLeaveFrom);
    const acceptLeaveTo = new Date(req.body.acceptLeaveTo);
    const leaveDuration = Math.round(
      (acceptLeaveTo.getTime() - acceptLeaveFrom.getTime()) /
      (1000 * 60 * 60 * 24)
    );

    let grantedLeave;

    if (req.body.status === 'APPROVED') {
      // Update the leave details for approved leave
      grantedLeave = await prisma.leaveApplication.update({
        where: {
          id: Number(req.params.id),
          
        },
        data: {
          acceptLeaveBy: req.auth.sub,
          acceptLeaveFrom: acceptLeaveFrom ? acceptLeaveFrom : undefined,
          acceptLeaveTo: acceptLeaveTo ? acceptLeaveTo : undefined,
          leaveDuration: leaveDuration ? leaveDuration : 0,
          reviewComment: req.body.reviewComment
            ? req.body.reviewComment
            : undefined,
          status: req.body.status,
        },
      });
    } else if (req.body.status === 'REJECTED') {
      // Update the leave details for rejected leave
      grantedLeave = await prisma.leaveApplication.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          acceptLeaveBy: req.auth.sub,
          acceptLeaveFrom: acceptLeaveFrom ? acceptLeaveFrom : undefined,
          acceptLeaveTo: acceptLeaveTo ? acceptLeaveTo : undefined,
          leaveDuration: leaveDuration ? leaveDuration : 0,
          reviewComment: req.body.reviewComment
            ? req.body.reviewComment
            : undefined,
          status: req.body.status,
        },
      });

      // Increment the remaining allowed leaves for the user by the leave duration
      const leaveApplication = await prisma.leaveApplication.findUnique({
        where: {
          id: Number(req.params.id),
        },
        select: {
          user: {
            select: {
              id: true, // Ensure you select the user's ID
              remainingannualallowedleave: true,
            },
          },
        },
      });


      

      const currentRemainingLeaves = parseInt(leaveApplication.user.remainingannualallowedleave);
      const updatedRemainingLeaves = currentRemainingLeaves + leaveDuration;
  
      await prisma.user.update({
        where: {
          id: leaveApplication.user.id,
        },
        data: {
          remainingannualallowedleave: updatedRemainingLeaves.toString(),
        },
      });
    }
 
    return res.status(200).json(
      grantedLeave,
    
    );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};



// const getLeaveByUserId = async (req, res) => {
//   try {
//     const getLeaveTo = await prisma.leaveApplication.findMany({
//       where: {
//         AND: {
//           userId: Number(req.params.id),
//           // status: "APPROVED",
//         },
//       },
//       orderBy: [
//         {
//           id: "desc",
//         },
//       ],
//     });

//     // check if the user has any leave
//     const isId = getLeaveTo.map((item) => item.id);

//     if (isId.length === 0)
//       return res.status(200).json({ message: "No leave found for this user" });

//     // check if the user is on leave
//     const leaveTo = getLeaveTo[0].leaveTo;
//     const currentDate = new Date();

//     let leaveStatus = "";
//     if (leaveTo > currentDate) leaveStatus = "onleave";
//     else leaveStatus = "not on leave";
//     const totalPendingLeaves = await prisma.leaveApplication.count({
//       where: {
//         AND: {
//           userId: Number(req.params.id),
//           status: "REJECTED",
//         },
//       },
//     });
//         const approvedBy = await prisma.user.findUnique({
//       where: {
//         id: req.auth.sub,
//       },
//     });

//     console.log(approvedBy,"dfahkhu");
//     // get all leave history
//     const singleLeave = await prisma.leaveApplication.findMany({
//       where: {
//         AND: {
//           userId: Number(req.params.id),
//         },
//       },
//       orderBy: [
//         {
//           id: "desc",
//         },
//       ],
//     });
//     const totalAcceptedLeaves = await prisma.leaveApplication.count({
     
//       where: {
//         AND: {
//           userId: Number(req.params.id),
//           status: "APPROVED",
//         },
//       },
//     });

//     const totalRejectedLeaves = await prisma.leaveApplication.count({
//       where: {
//         AND: {
//           userId: Number(req.params.id),
//           status: "PENDING",
//         },
//       },

//     });

   
   
// console.log(approvedBy,"rweukhjk");
//     return res.status(200).json({ singleLeave, leaveStatus , totalAcceptedLeaves,
//       totalRejectedLeaves,
//       totalPendingLeaves});
//   } catch (error) {
//     return res.status(400).json({ message: error.message });
//   }
// };




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
          status: "REJECTED",
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
          status: "PENDING",
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
module.exports = {
  createSingleLeave,
  getAllLeave,
  getSingleLeave,
  grantedLeave,
  getLeaveByUserId,
  deleteSingleLeave,
  adminSingleLeave,
};
