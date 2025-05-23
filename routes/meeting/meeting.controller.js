const { getPagination } = require("../../utils/query");
const prisma = require("../../utils/prisma");
const moment = require("moment");
const admin = require("firebase-admin");
var FCM = require("fcm-node");

const createmeeting = async (req, res) => {
  try {
    const {
      userId,
      departmentId,
      locationId,
      meetingdate,
      startTime,
      endTime,
      meetingType,
      meetingLink,
    } = req.body;

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
      return res
        .status(400)
        .json({ message: "Meeting is already scheduled for the same date." });
    }

    const newMeeting = await prisma.meeting.create({
      data: {
        meetingdate: new Date(meetingdate),
        startTime: startTime,
        endTime: endTime,
        meetingType,
        meetingLink,
        departmentId: departmentId === 0 ? null : departmentId,
        locationId,
        assignedBy: req.auth.sub,
        user: {
          connect: userId.map((id) => ({ id })),
        },
      },
    });
    const userIds = userId.map((id) => id); // Extract user IDs from userId array

    const userTokens = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        firebaseToken: true,
        status: true,
      },
    });
    const tokens = userTokens
      .filter((user) => user.firebaseToken && user.status === true)
      .map((user) => user.firebaseToken);

    const Title = "Meeting notification";
    const Body = req.body.meetingdate;
    const Desc = "Meeting notification";

    console.log(Title, Body, Desc, tokens);
    await sendNotify(Title, Body, Desc, tokens);

    return res.status(200).json({
      newMeeting,
      message: "Meeting created successfully.",
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return res.status(400).json({ message: "Failed to create meeting" });
  }
};
//get all meetings behalf of date
const getAllMeeting = async (req, res) => {
  try {
    const { date } = req.query;

    if (date) {
      // If date query parameter is provided, return meetings for that specific date
      const meetingDate = new Date(date);
      const meetings = await prisma.meeting.findMany({
        where: {
          meetingdate: meetingDate,
        },
        orderBy: [
          {
            id: "desc",
          },
        ],
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
              department: true,
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
    } else {
      // If no date query parameter is provided, return all meetings
      const meetings = await prisma.meeting.findMany({
        orderBy: [
          {
            id: "desc",
          },
        ],
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
              department: true,
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
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//get meeting by id controller
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

    return res.status(404).json({ message: "Meeting not found" });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Failed to get meeting", error: error.message });
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

    if (meetings.length === 0) return res.status(200).json({ meeting: [] });

    const tasksWithAssignedBy = await Promise.all(
      meetings.map(async (meeting) => {
        const meetingDate = new Date(meeting.meetingdate);
        const startTime = new Date(meeting.startTime);
        const endTime = new Date(meeting.endTime);
        let status;
        if (currentDate < startTime) {
          status = "UPCOMING";
        } else if (currentDate >= startTime && currentDate <= endTime) {
          status = "STARTED";
        } else {
          status = "ENDED";
        }
        // Calculate meeting duration
        const durationInMinutes = (endTime - startTime) / (1000 * 60);
        const durationHours = Math.floor(durationInMinutes / 60);
        const durationMinutes = Math.round(durationInMinutes % 60);
        const duration = `${durationHours
          .toString()
          .padStart(2, "0")} hours and ${durationMinutes
          .toString()
          .padStart(2, "0")} minutes`;

        let assignedByUser = null;
        if (meeting.assignedBy) {
          assignedByUser = await prisma.user.findUnique({
            where: { id: meeting.assignedBy },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userName: true,
            },
          });
        }

        return {
          ...meeting,
          assignedBy: assignedByUser,
          //   startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          //   endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          startTime: new Intl.DateTimeFormat("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Karachi", // Set timezone to Pakistan
          }).format(startTime),
          endTime: new Intl.DateTimeFormat("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Karachi", // Set timezone to Pakistan
          }).format(endTime),
          duration,
          status,
        };
      })
    );

    return res.status(200).json({ meeting: tasksWithAssignedBy });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Failed to get meeting", error: error.message });
  }
};

const updateMeeting = async (req, res) => {
  try {
    const { userId, meetingType, meetingLink, departmentId, locationId } =
      req.body;

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
          connect: userId.map((id) => ({ id })),
        },
      },
    });

    return res.status(200).json({
      updatedMeeting,
      message: "Meeting updated successfully",
    });
  } catch (error) {
    return res.status(400).json({ message: "Failed to update meeting" });
  }
};

//delete meeting controller
const deleteMeeting = async (req, res) => {
  try {
    const deletedMeeting = await prisma.meeting.delete({
      where: {
        id: Number(req.params.id),
      },
    });
    return res.status(200).json({
      message: "Meeting deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({ message: "Failed to delete meeting" });
  }
};
//funtion for send notification of meeting for all user
async function sendNotify(title, body, desc, tokens) {
  try {
    if (!Array.isArray(tokens)) {
      console.error("Error: tokens is not an array. Received:", tokens);
      tokens = tokens ? [tokens] : []; // Convert to array if it's a string, or make it an empty array
    }
    const messages = tokens.map((token) => ({
      data: {
        screen: "Meetings", // Specify the screen to navigate to
      },
      notification: {
        title: title,
        body: body,
      },
      token: token,
    }));

    const sendPromises = messages.map((message) =>
      admin.messaging().send(message)
    );

    const results = await Promise.allSettled(sendPromises);
    console.log("Results:", results);

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(`✅ Notification sent to token: ${tokens[index]}`);
        console.log(`🔹 Screen: ${messages[index].data.screen}`); // ✅ Corrected
      } else {
        console.log(
          `❌ Failed to send notification to token ${tokens[index]}: ${result.reason}`
        );
      }
    });
  } catch (error) {
    console.error("🚨 Error sending notifications:", error);
  }
}
module.exports = {
  createmeeting,
  getAllMeeting,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  getMeetingByuserId,
};
