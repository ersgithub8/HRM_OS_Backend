const { getPagination } = require("../../utils/query");
const prisma = require("../../utils/prisma");
const moment = require("moment");
const { schedule } = require("node-cron");

// const createShift = async (req, res) => {
  
//     try {
//         const timeDiff = moment(req.body.endTime).diff(moment(req.body.startTime));
//         const totalMinutes = timeDiff / (1000 * 60);
//         const hours = Math.floor(totalMinutes / 60);
//         const minutes = totalMinutes % 60;
//         const workHour = parseFloat(`${hours}.${(minutes < 10 ? '0' : '')}${minutes.toFixed(2)}`);
//         if (workHour < 1) {
//           displayValue = `${minutes} min`;
//         } else {
//           displayValue = `${workHour} hr`;
//         }
//         const createShift = await prisma.shifts.create({
//             data: {
//               name: req.body.name,
//               shiftFrom: new Date(req.body.shiftFrom),
//               shiftTo: new Date(req.body.shiftTo),
//               weekNumber: req.body.weekNumber,
//               userId: req.body.userId,
//               locationId: req.body.locationId,
//               assignedBy:req.auth.sub,
//               status:req.body.status,
//               generalInfo:req.body.generalInfo,
//               schedule: req.body.schedule ? {
//                 create: req.body.schedule.map((e) => {
//                   const timeDiff = moment(e.endTime).diff(moment(e.startTime));
//         const totalMinutes = timeDiff / (1000 * 60);
//         const hours = Math.floor(totalMinutes / 60);
//         const minutes = totalMinutes % 60;
//         const workHour = parseFloat(`${hours}.${(minutes < 10 ? '0' : '')}${minutes.toFixed(2)}`);
//                   return {
//                     day: e.day,
//                     startTime: new Date(e.startTime),
//                     endTime: new Date(e.endTime),
//                     breakTime:e.breakTime,
//                     roomId:e.roomId,
//                     workHour:workHour
//                   };
//                 }),
//               } : {},
//             },
//           });
//           return res.status(200).json({createShift,
//           message:"Shift created succssfully"});
//       } catch (error) {
//         console.error(error);
//         return res.status(400).json({ message: 'Failed to create shift' });
//       }
      
  
// };


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
    const startDateTime = new Date(shiftFrom);
    const endDateTime = new Date(shiftTo);
    endDateTime.setHours(0,0,0,0)
    const allShifts = await prisma.shifts.findMany({

      
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
            folderTime:true,
            room: {    
              select: {
                roomName: true,   
              },
            },
            // roomId:true,
            workHour:true,
            status:true,
            shiftsId:true,
            // generalInfo:true,
            createdAt:true,
            updatedAt:true,

          },
        }
        // room:true
      },
    });
    

    // If you want to map the results to include assignedBy user information for each shift, you can do that here.
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

    const singleShift = await prisma.shifts.findUnique({
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
          },
        },
        location: true,
        schedule: true,
      },
    });
console.log(singleShift);
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
            startTime: new Date(scheduleItem.startTime),
            endTime: new Date(scheduleItem.endTime),
            breakTime: scheduleItem.breakTime,
            roomId: scheduleItem.roomId,
            workHour: workHour,
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


module.exports = {
  createShift,
  getAllShift,
  getSingleShift,
  updateSingleShift,
  deleteSingleShift,
  getSingleShiftbyuserId,
};
