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
        const createShift = await prisma.shifts.create({
            data: {
              name: req.body.name,
              shiftFrom: new Date(req.body.shiftFrom),
              shiftTo: new Date(req.body.shiftTo),
              weekNumber: req.body.weekNumber,
              userId: req.body.userId,
              locationId: req.body.locationId,
              assignedBy:req.auth.sub,
              status: true,
              schedule: req.body.schedule ? {
                create: req.body.schedule.map((e) => {
                  const timeDiff = moment(e.endTime).diff(moment(e.startTime));
        const totalMinutes = timeDiff / (1000 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const workHour = parseFloat(`${hours}.${(minutes < 10 ? '0' : '')}${minutes.toFixed(2)}`);
                  return {
                    day: e.day,
                    startTime: new Date(e.startTime),
                    endTime: new Date(e.endTime),
                    breakTime:e.breakTime,
                    generalInfo:e.generalInfo,
                    roomId:e.roomId,
                    workHour:workHour
                  };
                }),
              } : {},
            },
          });
          return res.status(200).json(createShift);
      } catch (error) {
        console.error(error);
        return res.status(400).json({ error: 'Internal Server Error' });
      }
      
  
};

const getAllShift = async (req, res) => {
  try {
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
        schedule: true,
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
        // assignedBy:true,
        location:true,
        schedule: true,

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
            generalInfo: scheduleItem.generalInfo,
            roomId: scheduleItem.roomId,
            workHour: workHour,
          },
        });
      }
    }

    return res.status(200).json(updatedShift);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: 'Internal Server Error' });
  }
};


const deleteSingleShift = async (req, res) => {
  try {
    const deleteShift = await prisma.shifts.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });
    return res.status(200).json(deleteShift);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createShift,
  getAllShift,
  getSingleShift,
  updateSingleShift,
  deleteSingleShift,
};
