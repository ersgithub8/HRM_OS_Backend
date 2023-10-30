const { getPagination } = require("../../utils/query");
const prisma = require("../../utils/prisma");
const moment = require("moment");
const { schedule } = require("node-cron");

const createShift = async (req, res) => {
  try {
    const timeDiff = moment(req.body.endTime).diff(moment(req.body.startTime));
    const totalMinutes = timeDiff / (1000 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const workHour = parseFloat(`${hours}.${(minutes < 10 ? '0' : '')}${minutes.toFixed(2)}`);
    
    let displayValue;
    if (workHour < 1) {
      displayValue = `${minutes} min`;
    } else {
      displayValue = `${workHour} hr`;
    }
    
    const createShiftData = {
      name: req.body.name,
      shiftFrom: new Date(req.body.shiftFrom),
      shiftTo: new Date(req.body.shiftTo),
      weekNumber: req.body.weekNumber,
      userId: req.body.userId,
      locationId: req.body.locationId,
      assignedBy: req.auth.sub,
      status: req.body.status,
      generalInfo: req.body.generalInfo,
      schedule: req.body.schedule ? {
        create: req.body.schedule.map((e) => {
          const scheduleData = {
            day: e.day,
            startTime: e.startTime ? new Date(e.startTime) : null,
            endTime: e.endTime ? new Date(e.endTime) : null,
            breakTime: e.breakTime ? e.breakTime : null,
            roomId: e.roomId ? e.roomId : null,
            folderTime:e.folderTime?e.folderTime:null,
            status:e.status

          };
          
          if (e.startTime && e.endTime) {
            const timeDiff = moment(e.endTime).diff(moment(e.startTime));
            const totalMinutes = timeDiff / (1000 * 60);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            const workHour = parseFloat(`${hours}.${(minutes < 10 ? '0' : '')}${minutes.toFixed(2)}`);
            scheduleData.workHour = workHour;
          } else {
            scheduleData.workHour = null;
          }
          
          return scheduleData;
        }),
      } : {},
    };

    const createShiftResult = await prisma.shifts.create({
      data: createShiftData,
    });

    return res.status(200).json({ createShift: createShiftResult, message: "Shift created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: 'Failed to create shift' });
  }
};

const getAllShift = async (req, res) => {
  try {
    const { shiftFrom, shiftTo } = req.query;
    const isDateRangeProvided = shiftFrom && shiftTo;

    let allShifts;
    if (isDateRangeProvided) {
      const startDateTime = new Date(shiftFrom);
      const endDateTime = new Date(shiftTo);
      endDateTime.setHours(23, 59, 59, 999); 
      allShifts = await prisma.shifts.findMany({
       
        where: {
         
          AND: [
            {
              shiftFrom: {
                lte: endDateTime, 
              },
            },
            {
              shiftTo: {
                gte: startDateTime,
              },
            },
          ],
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
          location: true,
          schedule: {
            select: {
              id: true,
              day: true,
              startTime: true,
              endTime: true,
              breakTime: true,
              folderTime: true,
              room: {
                select: {
                  roomName: true,
                },
              },
              workHour: true,
              status: true,
              shiftsId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    } else {
      const today = new Date();
      startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 99)
      allShifts = await prisma.shifts.findMany({
        where: {
         
          AND: [
            {
              shiftFrom: {
                lte: endOfToday, 
              },
            },
            {
              shiftTo: {
                gte: startOfToday,
              },
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
              id: true,
              firstName: true,
              lastName: true,
              userName: true,
            },
          },
          location: true,
          schedule: {
            select: {
              id: true,
              day: true,
              startTime: true,
              endTime: true,
              breakTime: true,
              folderTime: true,
              room: {
                select: {
                  roomName: true,
                },
              },
              workHour: true,
              status: true,
              shiftsId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    }
console.log(allShifts.schedule)
    const shiftsWithAssignedBy = await Promise.all(allShifts.map(async (shift) => {
      if (shift.assignedBy) {
        const assignedByUser = await prisma.user.findUnique({
          where: { id: shift.assignedBy },
          select: { id: true, firstName: true, lastName: true, userName: true },
        });
        return { ...shift, assignedBy: assignedByUser };
      }
      return shift;
    }));

    return res.status(200).json(shiftsWithAssignedBy);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};


const getAllShiftmobile = async (req, res) => {
  try {
    let startOfToday, endOfToday;
    const { startDate, endDate } = req.query;

    if (startDate && endDate) {
      startOfToday = new Date(startDate);
      endOfToday = new Date(endDate);
      endOfToday.setHours(23, 59, 59, 999);
    } else {
      const today = new Date();
      startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    }

    const allShifts = await prisma.shifts.findMany({
      where: {
        AND: [
          {
            shiftFrom: { lte: endOfToday },
          },
          {
            shiftTo: { gte: startOfToday },
          },
        ],
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
        location: true,
        schedule: {
          select: {
            id: true,
            day: true,
            startTime: true,
            endTime: true,
            breakTime: true,
            folderTime: true,
            room: {
              select: {
                roomName: true,
              },
            },
            workHour: true,
            status: true,
            shiftsId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const selectedSchedules = [];
    allShifts.forEach((shift) => {
      const selectedShifts = shift.schedule.filter((singleSchedule) => {
        const scheduleStartTime = new Date(singleSchedule.startTime);
        return scheduleStartTime >= startOfToday && scheduleStartTime <= endOfToday;
      });
      selectedSchedules.push({ ...shift, schedule: selectedShifts });
    });

    return res.status(200).json(selectedSchedules);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};




const getSingleShift = async (req, res) => {
  try {
    const singleShift = await prisma.shifts.findUnique({
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
            employeeId:true,
            designation:true,
          },
        },
        location:true,
        schedule: {
          select: {
            id: true,
            day: true,
            startTime: true,
            endTime: true,
            breakTime: true,
            folderTime:true,
            room: {    
              select: {
                roomName: true,   
              },
            },
            workHour:true,
            status:true,
            shiftsId:true,
            // generalInfo:true,
            createdAt:true,
            updatedAt:true,

          },
        }

      },
    });
    if(!singleShift){
      return res.status(400).json({message:"Shift not found" })
    }
    if (singleShift && singleShift.assignedBy) {
      const assignedByUser = await prisma.user.findUnique({
        where: { id: singleShift.assignedBy },
        select: { id: true, firstName: true, lastName: true, userName: true },
      });
      const shiftWithAssignedBy = {
        ...singleShift,
        assignedBy: assignedByUser,
      };
    

    return res.status(200).json(shiftWithAssignedBy);
  }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
const getSingleShiftbyuserId = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const singleShift = await prisma.shifts.findMany({
      where: {
        userId: userId, 
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userName: true,
            employeeId:true,
            designation:true,
          },
        },
        location: true,
        schedule: {
          select: {
            id: true,
            day: true,
            startTime: true,
            endTime: true,
            breakTime: true,
            folderTime:true,
            room: {    
              select: {
                roomName: true,   
              },
            },
            workHour:true,
            status:true,
            shiftsId:true,
            createdAt:true,
            updatedAt:true,

          },
        }
      },
    });

    if (singleShift) {
      if (singleShift.assignedBy) {
        const assignedByUser = await prisma.user.findUnique({
          where: { id: singleShift.assignedBy },
          select: { id: true, firstName: true, lastName: true, userName: true },
        });
        singleShift.assignedBy = assignedByUser;
      }

      return res.status(200).json(singleShift);
    } else {
      return res.status(404).json({ message: 'Shift not found for the specified user ID.' });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
};

const updateSingleShift = async (req, res) => {
  try {
    const shiftId = Number(req.params.id); 
    const updatedShift = await prisma.shifts.update({
      where: {
        id: shiftId,
      },
      data: {
        name: req.body.name,
        shiftFrom: new Date(req.body.shiftFrom),
        shiftTo: new Date(req.body.shiftTo),
        weekNumber: req.body.weekNumber,
        generalInfo:req.body.generalInfo,
        userId: req.body.userId,
        locationId: req.body.locationId,
        assignedBy: req.auth.sub,
        status: true,
      },
    });

    if (req.body.schedule) {
      for (const scheduleItem of req.body.schedule) {
        const timeDiff = moment(scheduleItem.endTime).diff(moment(scheduleItem.startTime));
        const totalMinutes = timeDiff / (1000 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const workHour = parseFloat(`${hours}.${(minutes < 10 ? '0' : '')}${minutes.toFixed(2)}`);
        await prisma.schedule.update({
          where: {
            id: scheduleItem.id, 
          },
          data: {
            day: scheduleItem.day,
            startTime: scheduleItem.startTime ? new Date(scheduleItem.startTime) : null,
            endTime: scheduleItem.endTime ? new Date(scheduleItem.endTime) : null,
            breakTime: scheduleItem.breakTime ? scheduleItem.breakTime : null,
            roomId: scheduleItem.roomId ? scheduleItem.roomId : null,
            folderTime:scheduleItem.folderTime?scheduleItem.folderTime:null,
            status:scheduleItem.status
          },
        });
      }
    }

    return res.status(200).json({updatedShift,
      message:"Shift updated succssfully"});
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: 'Failed to update shift' });
  }
};

const deleteSingleShift = async (req, res) => {
  try {
    const shiftId = parseInt(req.params.id);
    const existingShift = await prisma.shifts.findUnique({
      where: { id: shiftId },
    });

    if (!existingShift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    const deleteShift = await prisma.shifts.delete({
      where: { id: shiftId },
    });

    return res.status(200).json({deleteShift,
      message:"Shift deleted succssfully"});
  } catch (error) {
    return res.status(400).json({ message: "Failed to delete shift" });
  }
};

// const swapSingleShift = async (req, res) => {
//   try {
//     const shiftId1 = Number(req.body.id1);
//     const shiftId2 = Number(req.body.id2);

//     // Find the first shift
//     const shift1 = await prisma.shifts.findUnique({
//       where: {
//         id: shiftId1,
//       },
//       include: {
//         schedule: true,
//       },
//     });

//     // Find the second shift
//     const shift2 = await prisma.shifts.findUnique({
//       where: {
//         id: shiftId2,
//       },
//       include: {
//         schedule: true,
//       },
//     });

//     // Check if shifts were found
//     if (!shift1 || !shift2) {
//       return res.status(400).json({ message: 'One or both shifts were not found.' });
//     }

//     // Update userId for the first shift
//     await prisma.shifts.update({
//       where: { id: shiftId1 },
//       data: {
//         userId: shift2.userId, // Swap userId values
//       },
//     });

//     // Update userId for the second shift
//     await prisma.shifts.update({
//       where: { id: shiftId2 },
//       data: {
//         userId: shift1.userId, // Swap userId values
//       },
//     });

//     // Update the Shift field for schedule items in the first shift
//     for (const scheduleItem of shift1.schedule) {
//       await prisma.schedule.update({
//         where: { id: scheduleItem.id },
//         data: {
//           shiftsId: shiftId2, // Assign to the new shift
//         },
//       });
//     }

//     // Update the Shift field for schedule items in the second shift
//     for (const scheduleItem of shift2.schedule) {
//       await prisma.schedule.update({
//         where: { id: scheduleItem.id },
//         data: {
//           shiftsId: shiftId1, // Assign to the new shift
//         },
//       });
//     }

//     return res.status(200).json({
//       message: 'Shift schedules swapped successfully',
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(400).json({ message: 'Failed to update shift' });
//   }
// };



// const swapSingleShift = async (req, res) => {
//   try {
//     const shiftId1 = Number(req.body.id1);
//     const shiftId2 = Number(req.body.id2);

//     const shift1 = await prisma.shifts.findUnique({
//       where: {
//         id: shiftId1,
//       },
//       include: {
//         schedule: true,
//       },
//     });

//     const shift2 = await prisma.shifts.findUnique({
//       where: {
//         id: shiftId2,
//       },
//       include: {
//         schedule: true,
//       },
//     });

//     if (!shift1 || !shift2) {
//       return res.status(400).json({ message: 'One or both shifts were not found.' });
//     }

//     const schedulesShift1 = shift1.schedule;
//     const schedulesShift2 = shift2.schedule;

//     await prisma.shifts.update({
//       where: { id: shiftId1 },
//       data: {
//         schedule: {
//           deleteMany: { id: { in: schedulesShift1.map((s) => s.id) } },
//           create: schedulesShift2.map((s) => ({
//             day: s.day,
//             startTime: s.startTime,
//             endTime: s.endTime,
//             breakTime: s.breakTime,
//             folderTime: s.folderTime,
//             roomId: s.roomId,
//             workHour: s.workHour,
//             status: s.status,
//             createdAt: s.createdAt,
//             updatedAt: s.updatedAt,
//           })),
//         },
//       },
//     });

//     await prisma.shifts.update({
//       where: { id: shiftId2 },
//       data: {
//         schedule: {
//           deleteMany: { id: { in: schedulesShift2.map((s) => s.id) } },
//           create: schedulesShift1.map((s) => ({
//             day: s.day,
//             startTime: s.startTime,
//             endTime: s.endTime,
//             breakTime: s.breakTime,
//             folderTime: s.folderTime,
//             roomId: s.roomId,
//             workHour: s.workHour,
//             status: s.status,
//             createdAt: s.createdAt,
//             updatedAt: s.updatedAt,
//           })),
//         },
//       },
//     });

//     return res.status(200).json({
//       message: 'Shift schedules swapped successfully',
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(400).json({ message: 'Failed to update shift' });
//   }
// };

const swapSingleShift = async (req, res) => {
  try {
    const scheduleItemId1 = Number(req.body.scheduleItemId1);
    const scheduleItemId2 = Number(req.body.scheduleItemId2);

    const scheduleItem1 = await prisma.schedule.findUnique({
      where: {
        id: scheduleItemId1,
      },
    });

    const scheduleItem2 = await prisma.schedule.findUnique({
      where: {
        id: scheduleItemId2,
      },
    });

    if (!scheduleItem1 || !scheduleItem2) {
      return res.status(400).json({ message: 'One or both schedule items were not found.' });
    }

    const shiftsId1 = scheduleItem1.shiftsId;
    const shiftsId2 = scheduleItem2.shiftsId;

    await prisma.schedule.update({
      where: { id: scheduleItemId1 },
      data: {
        shiftsId: shiftsId2,
      },
    });

    await prisma.schedule.update({
      where: { id: scheduleItemId2 },
      data: {
        shiftsId: shiftsId1,
      },
    });

    return res.status(200).json({
      message: 'Rooms swapped successfully',
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: 'Failed to update schedule items' });
  }
};
const swapSingleShiftRequest = async (req, res) => {
  try {
    const scheduleItemId1 = Number(req.body.scheduleItemId1);
    const scheduleItemId2 = Number(req.body.scheduleItemId2);

    const scheduleItem1 = await prisma.schedule.findUnique({
      where: {
        id: scheduleItemId1,
      },
    });

    const scheduleItem2 = await prisma.schedule.findUnique({
      where: {
        id: scheduleItemId2,
      },
    });

    if (!scheduleItem1 || !scheduleItem2) {
      return res.status(400).json({ message: 'One or both schedule items were not found.' });
    }

    const shiftsId1 = scheduleItem1.shiftsId;
    const shiftsId2 = scheduleItem2.shiftsId;

    await prisma.schedule.update({
      where: { id: scheduleItemId1 },
      data: {
        shiftsId: shiftsId2,
      },
    });

    await prisma.schedule.update({
      where: { id: scheduleItemId2 },
      data: {
        shiftsId: shiftsId1,
      },
    });

    return res.status(200).json({
      message: 'Rooms swapped successfully',
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: 'Failed to update schedule items' });
  }
};




module.exports = {
  createShift,
  getAllShift,
  getSingleShift,
  updateSingleShift,
  deleteSingleShift,
  getSingleShiftbyuserId,
  swapSingleShift,
  swapSingleShiftRequest,
  getAllShiftmobile
};
