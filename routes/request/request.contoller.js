const { getPagination } = require("../../utils/query");
const prisma = require("../../utils/prisma");

const addrequest=async(req,res)=>{
    try { 
      const createrequestData = {
        FromScheduleId: req.body.FromScheduleId,
        ToScheduleId: req.body.ToScheduleId,
        userId:req.body.userId,
      };
  
      const createRequestResult = await prisma.request.create({
        data: createrequestData,
      });
  
      return res.status(200).json({ createRequest: createRequestResult, message: "Request created successfully" });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ message: 'Failed to create request' });
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
      const singleShift = await prisma.request.findMany({
        where: {
          userId: userId,
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
        return res.status(400).json({ message: "Request not found" });
      }
  
      const shiftsWithSchedulesAndUsers = [];
  
      for (const shift of singleShift) {
        const scheduleFrom = await prisma.schedule.findUnique({
          where: { id: shift.FromScheduleId },
          include: {
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
  
        shiftsWithSchedulesAndUsers.push({
          ...shift,
          scheduleFrom: scheduleFrom,
          scheduleTo: scheduleTo,
        });
      }
  
      return res.status(200).json(shiftsWithSchedulesAndUsers);
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
  
          fromScheduleData.roomId = toSchedule.roomId;
          fromScheduleData.shiftsId = toSchedule.shiftsId;
          fromScheduleData.day = toScheduleData.day;
  
          toScheduleData.roomId = tempRoomId;
          toScheduleData.shiftsId = tempShiftsId;
          toScheduleData.day = tempDay;
  
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
  
          fromScheduleData.roomId = toSchedule.roomId;
          fromScheduleData.shiftsId = toSchedule.shiftsId;
          fromScheduleData.day = toScheduleData.day;
  
          toScheduleData.roomId = tempRoomId;
          toScheduleData.shiftsId = tempShiftsId;
          toScheduleData.day = tempDay;
  
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
  
          fromScheduleData.roomId = toSchedule.roomId;
          fromScheduleData.shiftsId = toSchedule.shiftsId;
          fromScheduleData.day = toScheduleData.day;
  
          toScheduleData.roomId = tempRoomId;
          toScheduleData.shiftsId = tempShiftsId;
          toScheduleData.day = tempDay;
  
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