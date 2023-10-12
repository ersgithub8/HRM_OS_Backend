const { getPagination } = require("../../utils/query");
const prisma = require("../../utils/prisma");
const moment = require("moment");


// const createmeeting = async (req, res) => {
//     try {
//       const { userId, departmentId, locationId, meetingdate, startTime, endTime, meetingType, meetingLink } = req.body; 
//       const conflictingMeeting = await prisma.meeting.findFirst({
//         where: {
//           meetingdate: new Date(meetingdate),
//           OR: [
//             {
//               // New meeting's start time falls within existing meeting's range
//               startTime: {
//                 lte: startTime,
//                 gte: startTime,
//               },
//             },
//             {
//               // New meeting's end time falls within existing meeting's range
//               endTime: {
//                 lte: endTime,
//                 gte: endTime,
//               },
//             },
//             {
//               // Existing meeting's range falls within new meeting's range
//               startTime: {
//                 lte: startTime,
//               },
//               endTime: {
//                 gte: endTime,
//               },
//             },
//           ],
//         },
//       });
  
//       if (conflictingMeeting) {
//         return res.status(400).json({ message: 'Already meeting schedule between this time' });
//       } 
//       const newMeeting = await prisma.meeting.create({
//         data: {
//           meetingdate: new Date(meetingdate),
//           startTime,
//           endTime,
//           meetingType,
//           meetingLink,
//           departmentId: departmentId, 
//           locationId: locationId,
//           assignedBy: req.auth.sub,
//           user: {
//             connect: userId.map(id => ({ id })),
//           }
//         },
//       });
  
//       return res.status(200).json({
//         newMeeting,
//         message: "Meeting created successfully"
//       });
//     } catch (error) {
//       console.error("Error creating meeting:", error);
//       return res.status(400).json({ message: "Failed to create meeting", error: error.message });
//     }
//   };
  
  


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



const createmeeting = async (req, res) => {
  try {
    const { userId, departmentId, locationId, meetingdate, startTime, endTime, meetingType, meetingLink } = req.body;


    // Check for conflicting meetings
    const conflictingMeeting = await prisma.meeting.findFirst({
        where: {
          meetingdate: new Date(meetingdate),
          OR: [
            {
              AND: [
                {
                  startTime: {
                    lte: startTime,
                  },
                },
                {
                  endTime: {
                    gte: startTime,
                  },
                },
              ],
            },
            {
              AND: [
                {
                  startTime: {
                    lte: endTime,
                  },
                },
                {
                  endTime: {
                    gte: endTime,
                  },
                },
              ],
            },
            {
              AND: [
                {
                  startTime: {
                    gte: startTime,
                  },
                },
                {
                  endTime: {
                    lte: endTime,
                  },
                },
              ],
            },
          ],
        },
      });
      
      if (conflictingMeeting) {
        return res.status(400).json({ message: 'A meeting is already scheduled during this time' });
      }
      

    const newMeeting = await prisma.meeting.create({
      data: {
        meetingdate: new Date(meetingdate),
        startTime: startTime,
        endTime: endTime,
        meetingType,
        meetingLink,
        departmentId,
        locationId,
        assignedBy: req.auth.sub,
        user: {
          connect: userId.map(id => ({ id })),
        },
      },
    });

    return res.status(200).json({
      newMeeting,
      message: 'Meeting created successfully',
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return res.status(400).json({ message: 'Failed to create meeting'});
  }
};

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
              department:true,
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
  
      // Retrieve the meeting by its ID and select only the user array
      const meeting = await prisma.meeting.findUnique({
        where: {
          id: meetingId,
        },
        select: {
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
  
      if (meeting) {
        return res.status(200).json(meeting);
      }
  
      return res.status(404).json({ message: 'Meeting not found' });
    } catch (error) {
      return res.status(400).json({ message: 'Failed to get meeting', error: error.message });
    }
  };
  
//original

// const getMeetingById = async (req, res) => {
//     try {
//       const meetingId = Number(req.params.id);
  
//       // Retrieve the task by its ID and include related data
//       const meeting = await prisma.meeting.findUnique({
//         where: {
//           id: meetingId,
//         },
//         include: {
//           location: {
//             select: {
//               id: true,
//               locationName: true,
//             },
//           },
//           department: {
//               select: {
//                 id: true,
//                 name: true,
//               },
//             },
//           user: {
//             select: {
//               id: true,
//               firstName: true,
//               lastName: true,
//               userName: true,
//               employeeId: true,
//               department: true,
//             },
//           },
//         },
//       });
  
//       if (meeting && meeting.assignedBy) {
//         const assignedByUser = await prisma.user.findUnique({
//           where: { id: meeting.assignedBy },
//           select: { id: true, firstName: true, lastName: true, userName: true },
//         });
  
//         const numAssignedUsers = meeting.user.length;
  
//         const taskWithAssignedByAndCount = {
//           ...meeting,
//           assignedBy: assignedByUser,
//           numAssignedUsers: numAssignedUsers,
//         };
  
//         return res.status(200).json(taskWithAssignedByAndCount);
//       }
  
//       return res.status(400).json({ message: 'Failed to get meeting' });
//     } catch (error) {
//       return res.status(400).json({ message: error.message });
//     }
//   };

// const getMeetingByuserId = async (req, res) => {
//   try {
//     const userId = Number(req.params.id);
    
//     const tasks = await prisma.meeting.findMany({
//       where: {
//         user: { some: { id: userId } }, 
//       },
//       include: {
//         // priority: { select: { id: true, name: true } },
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             userName: true,
//             employeeId: true,
//           },
//         },
//         department: {
//             select: {
//               id: true,
//               name: true,
//             },
//           },
//           location: {
//             select: {
//               id: true,
//               locationName: true,
//             },
//           },
//       },
//       orderBy: [{ id: "desc" }],
//     });

//     if (tasks.length === 0)
//       return res.status(400).json([]);

//     // Filter tasks to only include the user with the specified ID in the array
//     const tasksFilteredByUserId = tasks.map((task) => ({
//       ...task,
//       user: task.user.filter((user) => user.id === userId),
//     }));

//     // Fetch assignedBy information and embed tasksFilteredByUserId
//     const tasksWithAssignedBy = await Promise.all(
//       tasksFilteredByUserId.map(async (task) => {
//         let assignedByUser = null;
//         if (task.assignedBy) {
//           assignedByUser = await prisma.user.findUnique({
//             where: { id: task.assignedBy },
//             select: { id: true, firstName: true, lastName: true, userName: true },
//           });
//         }

//         return { ...task, assignedBy: assignedByUser };
//       })
//     );
    

//     return res.status(200).json({ tasks: tasksWithAssignedBy });
//   } catch (error) {
//     return res.status(400).json({ message:"Failed to get meeting" });
//   }
// };

// const getMeetingByuserId = async (req, res) => {
//     try {
//       const userId = Number(req.params.id);
  
//       const meeting = await prisma.meeting.findMany({
//         where: {
//           user: { some: { id: userId } },
//         },
//         include: {
//           user: {
//             select: {
//               id: true,
//               firstName: true,
//               lastName: true,
//               userName: true,
//               employeeId: true,
//             },
//           },
//           department: {
//             select: {
//               id: true,
//               name: true,
//             },
//           },
//           location: {
//             select: {
//               id: true,
//               locationName: true,
//             },
//           },
//         },
//         orderBy: [{ id: "desc" }],
//       });
  
//       if (meeting.length === 0)
//         return res.status(400).json([]);
  
//       // Filter tasks to only include the user with the specified ID in the array
//       const tasksFilteredByUserId = meeting.map((metting) => ({
//         ...metting,
//         user: metting.user.filter((user) => user.id === userId),
//       }));
  
//       // Fetch assignedBy information and embed tasksFilteredByUserId
//       const tasksWithAssignedBy = await Promise.all(
//         tasksFilteredByUserId.map(async (meeting) => {
//           let assignedByUser = null;
//           if (meeting.assignedBy) {
//             assignedByUser = await prisma.user.findUnique({
//               where: { id: meeting.assignedBy },
//               select: { id: true, firstName: true, lastName: true, userName: true },
//             });
//           }
  
//           // Calculate meeting duration
//           const startTime = new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//           const endTime = new Date(meeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//           const durationInMinutes = (new Date(meeting.endTime) - new Date(meeting.startTime)) / (1000 * 60);
          
//           // Round duration to nearest whole number
//           const durationHours = Math.round(durationInMinutes / 60);
//           const durationMinutes = Math.round(durationInMinutes % 60);
//           const duration = `${durationHours.toString().padStart(2, '0')} hours and ${durationMinutes.toString().padStart(2, '0')} minutes`;
//           const tasksWithStatus = meeting.map((meeting) => {
//             const startTime = new Date(meeting.meetingDate);
//             const endTime = new Date(meeting.meetingDate);
      
//             let status;
//             if (startTime > currentDate) {
//               status = "upcoming";
//             } else if (startTime <= currentDate && endTime >= currentDate) {
//               status = "today";
//             } else {
//               status = "previous";
//             }
      
//             return {
//               ...meeting,
//               status,
//               startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//               endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//             };
//           });
//           return {
//             ...meeting,
//             assignedBy: assignedByUser,
//             startTime,
//             endTime,
//             // durationHours,
//             // durationMinutes,
//             duration,
//             // status
//           };
//         })
//       );
  
//       return res.status(200).json({ meeting: tasksWithAssignedBy });
//     } catch (error) {
//       return res.status(400).json({ message: "Failed to get meeting", error: error.message });
//     }
//   };

const getMeetingByuserId = async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const currentDate = new Date();
      const meetings = await prisma.meeting.findMany({
        where: {
          user: { some: { id: userId } },
        },
        include: {
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
        },
        orderBy: [{ id: "desc" }],
      });
  
      if (meetings.length === 0)
        return res.status(400).json([]);
  
      const tasksWithAssignedBy = await Promise.all(
        meetings.map(async (meeting) => {
            const meetingDate = new Date(meeting.meetingdate);
            const startTime = new Date(meeting.startTime);
            const endTime = new Date(meeting.endTime);
          let status;
          if (meetingDate > currentDate) {
            status = "UPCOMING";
          } else if (currentDate >= startTime && currentDate <= endTime) {
            status = "ONGOING";
          } else {
            status = "ENDED";
          }
          // Calculate meeting duration
          const durationInMinutes = (endTime - startTime) / (1000 * 60);
          const durationHours = Math.floor(durationInMinutes / 60);
          const durationMinutes = Math.round(durationInMinutes % 60);
          const duration = `${durationHours.toString().padStart(2, '0')} hours and ${durationMinutes.toString().padStart(2, '0')} minutes`;
  
          let assignedByUser = null;
          if (meeting.assignedBy) {
            assignedByUser = await prisma.user.findUnique({
              where: { id: meeting.assignedBy },
              select: { id: true, firstName: true, lastName: true, userName: true },
            });
          }
  
          return {
            ...meeting,
            assignedBy: assignedByUser,
            startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration,
            status,
          };
        })
      );
  
      return res.status(200).json({ meeting: tasksWithAssignedBy });
    } catch (error) {
      return res.status(400).json({ message: "Failed to get meeting", error: error.message });
    }
  };
  
  

const updateMeeting = async (req, res) => {
    try {
      const { userId, meetingType, meetingLink, departmentId, locationId } = req.body;
  
      const meetingdate = new Date(req.body.meetingdate);
      const startTime = new Date(req.body.startTime);
      const endTime = new Date(req.body.endTime);
  
      const updatedMeeting = await prisma.meeting.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          meetingdate,
          startTime,
          endTime,
          meetingType,
          meetingLink,
          departmentId,
          locationId,
          assignedBy: req.auth.sub,
          user: {
            connect: userId.map(id => ({ id })),
          },
        },
      });
  
      return res.status(200).json({
        updatedMeeting,
        message: "Meeting updated successfully",
      });
    } catch (error) {
      return res.status(400).json({ message: "Failed to update meeting"});
    }
  };
  




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
  updateMeeting,
  deleteMeeting,
  getMeetingByuserId,
};
