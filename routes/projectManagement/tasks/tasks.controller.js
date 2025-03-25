const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");
const admin = require("firebase-admin");
var FCM = require("fcm-node");

const createTask = async (req, res) => {
  try {
    const {
      userId,
      name,
      startDate,
      endDate,
      description,
      completionTime,
      adminattachment,
      userAttachment,
      priorityId,
      departmentId,
    } = req.body;

    const newTask = await prisma.task.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        department:
          departmentId !== 0
            ? {
                connect: {
                  id: departmentId,
                },
              }
            : undefined,
        description,
        completionTime: parseFloat(completionTime),
        adminattachment,
        userAttachment,
        assignedBy: req.auth.sub,
        priority: {
          connect: {
            id: priorityId,
          },
        },
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

    const Title = "Task:" + req.body.name;
    const Body = req.body.description;
    const Desc = "Task notification";

    console.log(Title, Body, Desc, tokens);
    await sendNotify(Title, Body, Desc, tokens);
    return res.status(200).json({
      newTask,
      message: "Task created Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Failed to create task" });
  }
};

const getAllTasks = async (req, res) => {
  if (req.query.query === "all") {
    try {
      const allTasks = await prisma.task.findMany({
        orderBy: [{ id: "desc" }],
        include: {
          priority: {
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
            },
          },
        },
      });

      // Fetch the updatedBy user information for each task
      const tasksWithUpdatedBy = await Promise.all(
        allTasks.map(async (task) => {
          if (task.updatedBy) {
            const updatedByUser = await prisma.user.findUnique({
              where: { id: task.updatedBy },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                userName: true,
              },
            });

            return {
              ...task,
              updatedByUser: updatedByUser || undefined,
            };
          } else {
            return {
              ...task,
              updatedByUser: undefined,
            };
          }
        })
      );

      return res.status(200).json(tasksWithUpdatedBy);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

//get task by id controller
const getTaskById = async (req, res) => {
  try {
    const taskId = Number(req.params.id);

    // Retrieve the task by its ID and include related data
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        priority: {
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

    // If the task is found, fetch the assignedBy user
    if (task && task.assignedBy) {
      const assignedByUser = await prisma.user.findUnique({
        where: { id: task.assignedBy },
        select: { id: true, firstName: true, lastName: true, userName: true },
      });

      // Calculate the number of assigned users
      const numAssignedUsers = task.user.length;

      // Merge assignedByUser details and the user count into the task
      const taskWithAssignedByAndCount = {
        ...task,
        assignedBy: assignedByUser,
        numAssignedUsers: numAssignedUsers,
      };

      return res.status(200).json(taskWithAssignedByAndCount);
    }

    return res
      .status(404)
      .json({ message: "Task not found or assignedBy user not available." });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getTaskByuserId = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const taskStatus = req.query.taskStatus; // Extract taskStatus from query

    let taskFilter = {};
    if (
      taskStatus === "PENDING" ||
      taskStatus === "INPROGRESS" ||
      taskStatus === "COMPLETED"
    ) {
      taskFilter = { taskStatus: taskStatus }; // Filter tasks based on taskStatus
    }
    const tasks = await prisma.task.findMany({
      where: {
        user: { some: { id: userId } },
        ...taskFilter,
      },
      include: {
        priority: { select: { id: true, name: true } },
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
      orderBy: [{ id: "desc" }],
    });

    if (tasks.length === 0) return res.status(200).json([]);
    const tasksFilteredByUserId = tasks.map((task) => ({
      ...task,
      user: task.user.filter((user) => user.id === userId),
    }));
    const tasksWithAssignedBy = await Promise.all(
      tasksFilteredByUserId.map(async (task) => {
        let assignedByUser = null;
        if (task.assignedBy) {
          assignedByUser = await prisma.user.findUnique({
            where: { id: task.assignedBy },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userName: true,
            },
          });
        }
        const startDate = new Date(task.startDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(task.endDate);
        endDate.setHours(0, 0, 0, 0);

        // Add one day to endDate to include it in the count
        endDate.setDate(endDate.getDate() + 1);

        // Calculate the difference in days
        const durationInDays = Math.floor(
          (endDate - startDate) / (1000 * 60 * 60 * 24)
        );
        console.log(durationInDays);

        return {
          ...task,
          assignedBy: assignedByUser,
          durationInDays: durationInDays,
        };

        // return { ...task, assignedBy: assignedByUser };
      })
    );

    return res.status(200).json({ tasks: tasksWithAssignedBy });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//update task controller
// const updateTask = async (req, res) => {

//     try {
//       const updatedTask = await prisma.task.update({
//         where: {
//           id: Number(req.params.id),
//         },
//         data: {
//           userAttachment:req.body.userAttachment,
//           reviewComment:req.body.reviewComment,
//           taskStatus:req.body.taskStatus,
//         },
//       });
//       return res.status(200).json({updatedTask,
//       message:"Task updated successfully"});
//     } catch (error) {
//       return res.status(400).json({ message: "Fialed to update task" });
//     }
//   }

const updateTask = async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const userId = Number(req.body.userId);
    // Update the task by its ID
    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        userAttachment: req.body.userAttachment,
        reviewComment: req.body.reviewComment,
        taskStatus: req.body.taskStatus,
        updatedBy: userId, // Set the updatedBy field to the user ID
      },
    });

    return res.status(200).json({
      updatedTask,
      message: "Task updated successfully",
    });
  } catch (error) {
    return res.status(400).json({ message: "Failed to update task" });
  }
};

//delete task controller
const deleteTask = async (req, res) => {
  try {
    const deletedTask = await prisma.task.delete({
      where: {
        id: Number(req.params.id),
      },
    });
    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({ message: "Failed to delete task" });
  }
};

const getAlluserHirarchy = async (req, res) => {
  const userId = parseInt(req.query.userId);
  const { skip, limit, status } = req.query;

  let users = [];

  try {
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ message: "Invalid userId provided" });
    }
    const fetchUsers = async (referenceId, userIdToExclude) => {
      const users = await prisma.user.findMany({
        where: {
          OR: [{ reference_id: referenceId }, { referenceid_two: referenceId }],
        },
      });

      const linkedUsers = await Promise.all(
        users.map(async (user) => {
          let dd = await fetchUsers(user.id);
          dd.push(user);
          return dd;
        })
      );

      return linkedUsers.flat();
    };
    const usersData = await fetchUsers(userId);
    let array = [];
    for (let x of usersData) {
      array.push(x.id);
    }
    console.log(array);

    const leave = await prisma.user.findMany({
      where: {
        id: { in: array },
      },
      orderBy: [
        {
          id: "desc",
        },
      ],
    });

    return res.status(200).json(
      leave
      // array
    );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
async function sendNotify(title, body, desc, tokens) {
  try {
    if (!Array.isArray(tokens)) {
      console.error("Error: tokens is not an array. Received:", tokens);
      tokens = tokens ? [tokens] : []; // Convert to array if it's a string, or make it an empty array
    }
    const messages = tokens.map((token) => ({
      data: {
        screen: "Task", // Specify the screen to navigate to
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
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getAlluserHirarchy,
  getTaskByuserId,
};
