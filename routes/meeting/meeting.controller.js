const { getPagination } = require("../../utils/query");
const prisma = require("../../utils/prisma");


const createmeeting = async (req, res) => {
    try {
      const { userId, departmentId, locationId, meetingdate, startTime, endTime, meetingType, meetingLink } = req.body; 
      const conflictingMeeting = await prisma.meeting.findFirst({
        where: {
          meetingdate: new Date(meetingdate),
          OR: [
            {
              // New meeting's start time falls within existing meeting's range
              startTime: {
                lte: startTime,
                gte: startTime,
              },
            },
            {
              // New meeting's end time falls within existing meeting's range
              endTime: {
                lte: endTime,
                gte: endTime,
              },
            },
            {
              // Existing meeting's range falls within new meeting's range
              startTime: {
                lte: startTime,
              },
              endTime: {
                gte: endTime,
              },
            },
          ],
        },
      });
  
      if (conflictingMeeting) {
        return res.status(400).json({ message: 'Already meeting schedule between this time' });
      } 
      const newMeeting = await prisma.meeting.create({
        data: {
          meetingdate: new Date(meetingdate),
          startTime,
          endTime,
          meetingType,
          meetingLink,
          departmentId: departmentId, 
          locationId: locationId,
          assignedBy: req.auth.sub,
          user: {
            connect: userId.map(id => ({ id })),
          }
        },
      });
  
      return res.status(200).json({
        newMeeting,
        message: "Meeting created successfully"
      });
    } catch (error) {
      console.error("Error creating meeting:", error);
      return res.status(400).json({ message: "Failed to create meeting", error: error.message });
    }
  };
  
  


//get all Meeting controller
// const getAllMeeting = async (req, res) => {
//   if (req.query.query === "all") {
//     try {
//       const allMeeting = await prisma.meeting.findMany({
        // orderBy: [
        //   {
        //     id: "desc",
        //   },
        // ],
//        include: {
//         location: {
//           select: {
//             id: true,
//             locationName: true,
//           },
//         },
//         department: {
//             select: {
//               id: true,
//               name: true,
//             },
//           },
        
//       }

      
      
      
//       });
//       console.log(allMeeting);
//       return res.status(200).json(allMeeting);
//     } catch (error) {
//       return res.status(400).json({ message: error.message });
//     }
//   }
// };


const getAllMeeting = async (req, res) => {
    try {
      const { date } = req.query;
      const meetingDate = new Date(date);
      const meetings = await prisma.meeting.findMany({
        where: {
          meetingdate: meetingDate,
        },
        select: {
          id: true,
          meetingdate: true,
          startTime: true,
          endTime: true,
          meetingType: true,
          meetingLink: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userName: true,
              employeeId: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          location: {
            select: {
              id: true,
              locationName: true,
            },
          },
          assignedBy: true,
          createdAt: true,
          updatedAt: true,
        },
      });
  
      return res.status(200).json(meetings);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  };
  
  
  
  
  

//get task by id controller
const getMeetingById = async (req, res) => {
  try {
    const meetingId = Number(req.params.id);

    // Retrieve the task by its ID and include related data
    const meeting = await prisma.meeting.findUnique({
      where: {
        id: meetingId,
      },
      include: {
        location: {
          select: {
            id: true,
            locationName: true,
          },
        },
        department: {
            select: {
              id: true,
              name: true,
            },
          },
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

    if (meeting && meeting.assignedBy) {
      const assignedByUser = await prisma.user.findUnique({
        where: { id: meeting.assignedBy },
        select: { id: true, firstName: true, lastName: true, userName: true },
      });

      const numAssignedUsers = meeting.user.length;

      const taskWithAssignedByAndCount = {
        ...meeting,
        assignedBy: assignedByUser,
        numAssignedUsers: numAssignedUsers,
      };

      return res.status(200).json(taskWithAssignedByAndCount);
    }

    return res.status(404).json({ message: 'Meeting not found or assignedBy user not available.' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};


const getMeetingByuserId = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    
    const tasks = await prisma.meeting.findMany({
      where: {
        user: { some: { id: userId } }, 
      },
      include: {
        // priority: { select: { id: true, name: true } },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userName: true,
            employeeId: true,
            department:true,
            location:true,
          },
        },
      },
      orderBy: [{ id: "desc" }],
    });

    if (tasks.length === 0)
      return res.status(200).json([]);

    // Filter tasks to only include the user with the specified ID in the array
    const tasksFilteredByUserId = tasks.map((task) => ({
      ...task,
      user: task.user.filter((user) => user.id === userId),
    }));

    // Fetch assignedBy information and embed tasksFilteredByUserId
    const tasksWithAssignedBy = await Promise.all(
      tasksFilteredByUserId.map(async (task) => {
        let assignedByUser = null;
        if (task.assignedBy) {
          assignedByUser = await prisma.user.findUnique({
            where: { id: task.assignedBy },
            select: { id: true, firstName: true, lastName: true, userName: true },
          });
        }

        return { ...task, assignedBy: assignedByUser };
      })
    );

    return res.status(200).json({ tasks: tasksWithAssignedBy });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// const updateTask = async (req, res) => {
//   try {
//     const taskId = Number(req.params.id);
//     const userId = Number(req.body.userId); 
//     // Update the task by its ID
//     const updatedTask = await prisma.task.update({
//       where: {
//         id: taskId,
//       },
//       data: {
//         userAttachment: req.body.userAttachment,
//         reviewComment: req.body.reviewComment,
//         taskStatus: req.body.taskStatus,
//         updatedBy: userId, // Set the updatedBy field to the user ID
//       },
//     });

//     return res.status(200).json({
//       updatedTask,
//       message: "Task updated successfully",
//     });
//   } catch (error) {
//     return res.status(400).json({ message: "Failed to update task" });
//   }
// };


//delete task controller
const deleteMeeting = async (req, res) => {
  try {
    const deletedMeeting = await prisma.meeting.delete({
      where: {
        id: Number(req.params.id),
      },
    });
    return res.status(200).json({
    message:"Meeting deleted successfully"});
  } catch (error) {
    return res.status(400).json({ message:"Failed to delete meeting" });
  }
};


module.exports = {
    createmeeting,
  getAllMeeting,
  getMeetingById,
//   updateTask,
  deleteMeeting,
  getMeetingByuserId,
};