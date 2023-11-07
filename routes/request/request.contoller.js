const { getPagination } = require("../../utils/query");
const prisma = require("../../utils/prisma");

const addrequest = async (req, res) => {
  try {
    const { FromScheduleId, ToScheduleId, userId } = req.body;

    const fromSchedule = await prisma.schedule.findUnique({
      where: { id: FromScheduleId },
    });

    const toSchedule = await prisma.schedule.findUnique({
      where: { id: ToScheduleId },
    });

    const fromStartDate = new Date(fromSchedule.startTime);
    const fromEndDate = new Date(fromSchedule.endTime);
    const toStartDate = new Date(toSchedule.startTime);
    const toEndDate = new Date(toSchedule.endTime);

    const fromStartTime = `${fromStartDate.getHours()}:${fromStartDate.getMinutes()}:${fromStartDate.getSeconds()}`;
    const fromEndTime = `${fromEndDate.getHours()}:${fromEndDate.getMinutes()}:${fromEndDate.getSeconds()}`;
    const toStartTime = `${toStartDate.getHours()}:${toStartDate.getMinutes()}:${toStartDate.getSeconds()}`;
    const toEndTime = `${toEndDate.getHours()}:${toEndDate.getMinutes()}:${toEndDate.getSeconds()}`;
    const existingRequest = await prisma.request.findFirst({
      where: {
        FromScheduleId,
        ToScheduleId,
        userId,
      },
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Request already exists for this shift" });
    }
    if (
      fromSchedule.shiftDate === toSchedule.shiftDate &&
      (fromStartTime !== toStartTime || fromEndTime !== toEndTime)
    )

     {
      const createRequestResult = await prisma.request.create({
        data: {
          FromScheduleId,
          ToScheduleId,
          userId,
        },
      });

      return res
        .status(200)
        .json({ createRequest: createRequestResult, message: "Request created successfully" });
    } else {
      return res
        .status(400)
        .json({ message: "Failed to create request shift statrtime endtime are same" });
    }
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "Failed to create a request" });
  }
};


  const getSinglerequest = async (req, res) => {
    try {
      const singleShift = await prisma.request.findUnique({
        where: {
          id: parseInt(req.params.id),
        },
        select: {
          id: true,
          FromScheduleId: true,
          ToScheduleId: true,
          requststatus: true,
          userId:true,
          createdAt: true,
          updatedAt: true,
        },
      });
  
      if (!singleShift) {
        return res.status(400).json({ message: "Request not found" });
      }
  
      const scheduleFrom = await prisma.schedule.findUnique({
        where: { id: singleShift.FromScheduleId },
        select: {
          id: true,
          day: true,
          startTime: true,
          endTime: true,
          shiftDate:true,
          breakTime: true,
          folderTime: true,
          room: { select: { roomName: true } },
          workHour: true,
          status: true,
          shiftsId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
  
      const scheduleTo = await prisma.schedule.findUnique({
        where: { id: singleShift.ToScheduleId },
        select: {
          id: true,
          day: true,
          startTime: true,
          endTime: true,
          shiftDate:true,
          breakTime: true,
          folderTime: true,
          room: { select: { roomName: true } },
          workHour: true,
          status: true,
          shiftsId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
  
      const shiftFromDetails = await prisma.shifts.findUnique({
        where: { id: scheduleFrom.shiftsId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userName: true,
              image:true,
              // Include any other user fields you require
            },
          },
        },
      });
  
      const shiftToDetails = await prisma.shifts.findUnique({
        where: { id: scheduleTo.shiftsId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userName: true,
              image:true,

              // Include any other user fields you require
            },
          },
        },
      });
  
      const shiftWithSchedulesAndUsers = {
        ...singleShift,
        scheduleFrom: { ...scheduleFrom, shifts: shiftFromDetails },
        scheduleTo: { ...scheduleTo, shifts: shiftToDetails },
      };
  
      return res.status(200).json(shiftWithSchedulesAndUsers);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  };
  
  const getAllrequest = async (req, res) => {
    try {
      const allRequests = await prisma.request.findMany({
        select: {
          id: true,
          FromScheduleId: true,
          ToScheduleId: true,
          requststatus: true,
          createdAt: true,
          updatedAt: true,
        },
      });
  
      const allRequestsWithDetails = [];
  
      for (const singleShift of allRequests) {
        const scheduleFrom = await prisma.schedule.findUnique({
          where: { id: singleShift.FromScheduleId },
          select: {
            id: true,
            day: true,
            startTime: true,
            endTime: true,
            shiftDate:true,
            breakTime: true,
            folderTime: true,
            room: { select: { roomName: true } },
            workHour: true,
            status: true,
            shiftsId: true,
            createdAt: true,
            updatedAt: true,
          },
        });
  
        const scheduleTo = await prisma.schedule.findUnique({
          where: { id: singleShift.ToScheduleId },
          select: {
            id: true,
            day: true,
            startTime: true,
            endTime: true,
            shiftDate:true,
            breakTime: true,
            folderTime: true,
            room: { select: { roomName: true } },
            workHour: true,
            status: true,
            shiftsId: true,
            createdAt: true,
            updatedAt: true,
          },
        });
  
        const shiftFromDetails = await prisma.shifts.findUnique({
          where: { id: scheduleFrom.shiftsId },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                userName: true,
                image:true,
                // Include any other user fields you require
              },
            },
          },
        });
  
        const shiftToDetails = await prisma.shifts.findUnique({
          where: { id: scheduleTo.shiftsId },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                userName: true,
                image:true,
                // Include any other user fields you require
              },
            },
          },
        });
  
        const shiftWithSchedulesAndUsers = {
          ...singleShift,
          scheduleFrom: { ...scheduleFrom, shifts: shiftFromDetails },
          scheduleTo: { ...scheduleTo, shifts: shiftToDetails },
        };
  
        allRequestsWithDetails.push(shiftWithSchedulesAndUsers);
      }
  
      return res.status(200).json(allRequestsWithDetails);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  };
  
  const getSingleuserrequest = async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { startDate, endDate } = req.query;
      let startOfDate, endOfDate;
  
      if (startDate && endDate) {
        startOfDate = new Date(startDate);
        endOfDate = new Date(endDate);
        endOfDate.setHours(23, 59, 59, 999);
      
  
      const singleShift = await prisma.request.findMany({
        where: {
          userId: userId,
          createdAt: {
            gte: startOfDate,
            lte: endOfDate,
          },
        },
        select: {
          id: true,
          FromScheduleId: true,
          ToScheduleId: true,
          requststatus: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
  
      if (!singleShift || singleShift.length === 0) {
        return res.status(200).json([]);
      }
  
      const shiftsWithSchedulesAndUsers = [];
  
      for (const shift of singleShift) {
        const scheduleFrom = await prisma.schedule.findUnique({
          where: { id: shift.FromScheduleId },
          include: {
            room: {
              select: {
                id: true,
                location: true, // You can include more fields as needed
                roomName: true,
                status: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            shifts: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    userName: true,
                    // Add other fields you need
                  },
                },
              },
            },
           
          },
        });
  
        const scheduleTo = await prisma.schedule.findUnique({
          where: { id: shift.ToScheduleId },
          include: {
            room: {
              select: {
                id: true,
                location: true,
                roomName: true,
                status: true,
                createdAt: true,
                updatedAt: true,
              },
            },
        
            
            shifts: {
             
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
            },
          },
        });
  
        shiftsWithSchedulesAndUsers.push({
          ...shift,
          scheduleFrom: scheduleFrom,
          scheduleTo: scheduleTo,
        });
      }
  
      return res.status(200).json(shiftsWithSchedulesAndUsers);
    }
    else{
      return res.status(200).json([]);
    }
   } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  };
  
  const swaprequest = async (req, res) => {
    try {
      const { userId, requststatus } = req.body;
  
      const existingRequest = await prisma.request.findFirst({
        where: {
          userId: userId,
        },
      });
  
      if (!existingRequest) {
        return res.status(400).json({ message: "Request not found" });
      }
  
      let updatedRequest;
  
      if (existingRequest.requststatus === 'PENDING'&&requststatus === 'APPROVED') {
        updatedRequest = await prisma.request.update({
          where: { id: existingRequest.id },
          data: {
            FromScheduleId: existingRequest.ToScheduleId,
            ToScheduleId: existingRequest.FromScheduleId,
            requststatus: 'APPROVED',
          },
          
        });
        
        
        const fromSchedule = await prisma.schedule.findUnique({
          where: { id: existingRequest.ToScheduleId },
        });
  
        const toSchedule = await prisma.schedule.findUnique({
          where: { id: existingRequest.FromScheduleId },
        });
  
        if (fromSchedule && toSchedule) {
          const fromScheduleData = { ...fromSchedule };
          const toScheduleData = { ...toSchedule };
  
          // Swap schedule attributes except for the 'ID'
          const tempRoomId = fromScheduleData.roomId;
          const tempShiftsId = fromScheduleData.shiftsId;
          const tempDay = fromScheduleData.day;
          const temshiftdate=fromScheduleData.shiftDate;
          const temstarttime=fromScheduleData.startTime;
          const temendtime=fromScheduleData.endTime;
  
          fromScheduleData.roomId = toSchedule.roomId;
          fromScheduleData.shiftsId = toSchedule.shiftsId;
          fromScheduleData.day = toScheduleData.day;
          fromScheduleData.shiftDate=toScheduleData.shiftDate;
          fromScheduleData.startTime=toScheduleData.startTime;
          fromScheduleData.endTime=toScheduleData.endTime;
  
          toScheduleData.roomId = tempRoomId;
          toScheduleData.shiftsId = tempShiftsId;
          toScheduleData.day = tempDay;
          toScheduleData.shiftDate=temshiftdate;
          toScheduleData.startTime=temstarttime;
          toScheduleData.endTime=temendtime;
  
          // Perform the schedule updates without modifying the 'ID' field
          await prisma.schedule.update({
            where: { id: existingRequest.ToScheduleId },
            data: fromScheduleData,
          });
  
          await prisma.schedule.update({
            where: { id: existingRequest.FromScheduleId },
            data: toScheduleData,
          });
        }
  
        return res.status(200).json({ updatedRequest, message: "Request status changed to APPROVED" });
      } else if (existingRequest.requststatus === 'APPROVED'&&requststatus === 'REJECTED') {
        updatedRequest = await prisma.request.update({
          where: { id: existingRequest.id },
          data: {
            FromScheduleId: existingRequest.ToScheduleId,
            ToScheduleId: existingRequest.FromScheduleId,
            requststatus: 'REJECTED',
            // reason:reason,
          },
        });
  
        const fromSchedule = await prisma.schedule.findUnique({
          where: { id: existingRequest.ToScheduleId },
        });
  
        const toSchedule = await prisma.schedule.findUnique({
          where: { id: existingRequest.FromScheduleId },
        });
  
        if (fromSchedule && toSchedule) {
          const fromScheduleData = { ...fromSchedule };
          const toScheduleData = { ...toSchedule };
  
          const tempRoomId = fromScheduleData.roomId;
          const tempShiftsId = fromScheduleData.shiftsId;
          const tempDay = fromScheduleData.day;
          const temshiftdate=fromScheduleData.shiftDate;
          const temstarttime=fromScheduleData.startTime;
          const temendtime=fromScheduleData.endTime;
  
          fromScheduleData.roomId = toSchedule.roomId;
          fromScheduleData.shiftsId = toSchedule.shiftsId;
          fromScheduleData.day = toScheduleData.day;
          fromScheduleData.shiftDate=toScheduleData.shiftDate;
          fromScheduleData.startTime=toScheduleData.startTime;
          fromScheduleData.endTime=toScheduleData.endTime;
  
          toScheduleData.roomId = tempRoomId;
          toScheduleData.shiftsId = tempShiftsId;
          toScheduleData.day = tempDay;
          toScheduleData.shiftDate=temshiftdate;
          toScheduleData.startTime=temstarttime;
          toScheduleData.endTime=temendtime;
  
          await prisma.schedule.update({
            where: { id: existingRequest.ToScheduleId },
            data: fromScheduleData,
          });
  
          await prisma.schedule.update({
            where: { id: existingRequest.FromScheduleId },
            data: toScheduleData,
          });
        }
  
        return res.status(200).json({ updatedRequest, message: "Request status changed to REJECTED" });
      }
      else if (existingRequest.requststatus === 'PENDING' && requststatus === 'REJECTED') {
        updatedRequest = await prisma.request.update({
          where: { id: existingRequest.id },
          data: {
            requststatus: 'REJECTED',
            // reason: reason,
          },
        });
        return res.status(200).json({ updatedRequest, message: "Request status changed to REJECTED" });
      }
      else if (existingRequest.requststatus === 'REJECTED'&&requststatus === 'APPROVED') {
        updatedRequest = await prisma.request.update({
          where: { id: existingRequest.id },
          data: {
            FromScheduleId: existingRequest.ToScheduleId,
            ToScheduleId: existingRequest.FromScheduleId,
            requststatus: 'APPROVED',
          },
        });
        
        const fromSchedule = await prisma.schedule.findUnique({
          where: { id: existingRequest.ToScheduleId },
        });
  
        const toSchedule = await prisma.schedule.findUnique({
          where: { id: existingRequest.FromScheduleId },
        });
  console.log(fromSchedule);
        if (fromSchedule && toSchedule) {
          const fromScheduleData = { ...fromSchedule };
          const toScheduleData = { ...toSchedule };
  
          const tempRoomId = fromScheduleData.roomId;
          const tempShiftsId = fromScheduleData.shiftsId;
          const tempDay = fromScheduleData.day;
          const temshiftdate=fromScheduleData.shiftDate;
          const temstarttime=fromScheduleData.startTime;
          const temendtime=fromScheduleData.endTime;
  
          fromScheduleData.roomId = toSchedule.roomId;
          fromScheduleData.shiftsId = toSchedule.shiftsId;
          fromScheduleData.day = toScheduleData.day;
          fromScheduleData.shiftDate=toScheduleData.shiftDate;
          fromScheduleData.startTime=toScheduleData.startTime;
          fromScheduleData.endTime=toScheduleData.endTime;
  
          toScheduleData.roomId = tempRoomId;
          toScheduleData.shiftsId = tempShiftsId;
          toScheduleData.day = tempDay;
          toScheduleData.shiftDate=temshiftdate;
          toScheduleData.startTime=temstarttime;
          toScheduleData.endTime=temendtime;
          await prisma.schedule.update({
            where: { id: existingRequest.ToScheduleId },
            data: fromScheduleData,
          });
  
          await prisma.schedule.update({
            where: { id: existingRequest.FromScheduleId },
            data: toScheduleData,
          });
        }
  
        return res.status(200).json({ updatedRequest, message: "Request status changed to REJECTED" });
      }
       else {
        return res.status(400).json({ message: "Invalid request status" });
      }
    } catch (error) {
      console.error(error);
      return res.status(400).json({ message: 'Failed to update request' });
    }
  };

  module.exports = {
    addrequest,
    getSinglerequest,
    getAllrequest,
    getSingleuserrequest,
    swaprequest
  }