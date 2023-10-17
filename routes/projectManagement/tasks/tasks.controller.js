const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");
const admin = require("firebase-admin");
var FCM = require("fcm-node");
//create tasks controller
// const createTask = async (req, res) => {
//   try {
//     const newTask = await prisma.task.create({
//       data: {
//         project: {
//           connect: {
//             id: req.body.projectId,
//           },
//         },
//         milestone: {
//           connect: {
//             id: req.body.milestoneId,
//           },
//         },
//         name: req.body.name,
//         startDate: new Date(req.body.startDate),
//         endDate: new Date(req.body.endDate),
//         description: req.body.description,
//         completionTime: parseFloat(req.body.completionTime),
//         priority: {
//           connect: {
//             id: req.body.priorityId,
//           },
//         },
//         taskStatus: {
//           connect: {
//             id: req.body.taskStatusId,
//           },
//         },
//         assignedTask: {
//           create: req.body.assignedTask
//             ? req.body.assignedTask.map((projectTeamId) => ({
//                 projectTeam: {
//                   connect: {
//                     id: Number(projectTeamId),
//                   },
//                 },
//               }))
//             : undefined,
//         },
//       },
//     });

//     return res.status(201).json(newTask);
//   } catch (error) {
//     return res.status(400).json({ message: error.message });
//   }
// };

const createTask = async (req, res) => {
  try {
    const { userId, name, startDate, endDate, description, completionTime, adminattachment, userAttachment, priorityId } = req.body;

    const newTask = await prisma.task.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description,
        completionTime: parseFloat(completionTime),
        adminattachment,
        userAttachment,
        assignedBy:req.auth.sub,
        priority: {
          connect: {
            id: priorityId,
          },
        },
        user: {
          connect: userId.map(id => ({ id })),
        }
      },
    });
    const userIds = userId.map(id => id); // Extract user IDs from userId array

    const userTokens = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        firebaseToken: true,
      },
    });
    
    const tokens = userTokens
      .filter((user) => user.firebaseToken)
      .map((user) => user.firebaseToken);
    
    const Title = req.body.name;
    const Body = req.body.description;
    const Desc = 'Task notification';
    
    console.log(Title, Body, Desc, tokens);
    await sendNotify(Title, Body, Desc, tokens);
    return res.status(200).json({
      newTask,
      message: "Task created Successfully"
    });
  } catch (error) {
    return res.status(400).json({ message: "Failed to create task" });
  }
};



//get all tasks controller
// const getAllTasks = async (req, res) => {
//   if (req.query.query === "all") {
//     try {
//       const allTasks = await prisma.task.findMany({
//         orderBy: [
//           {
//             id: "desc",
//           },
//         ],
//        include: {
//         priority: {
//           select: {
//             id: true,
//             name: true,
//           },
//         },
        
//       }

      
      
      
//       });
//       return res.status(200).json(allTasks);
//     } catch (error) {
//       return res.status(400).json({ message: error.message });
//     }
//   } else if (req.query.status === "true") {
//     try {
//       const allTasks = await prisma.task.findMany({
//         orderBy: [
//           {
//             id: "desc",
//           },
//         ],
//        include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             userName: true,
//             employeeId: true,
        
//           },
//         },
        
//       },
//         where: {
//           status: true,
//         },
//       });
//       return res.status(200).json(allTasks);
//     } catch (error) {
//       return res.status(400).json({ message: error.message });
//     }
//   } else if (req.query.status === "false") {
//     try {
//       const allTasks = await prisma.task.findMany({
//         orderBy: [
//           {
//             id: "desc",
//           },
//         ],
//        include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             userName: true,
//             employeeId: true,
//             priority:true

//           },
//         },
//       },
//         where: {
//           status: false,
//         },
//       });
//       return res.status(200).json(allTasks);
//     } catch (error) {
//       return res.status(400).json({ message: error.message });
//     }
//   }
// };

const getAllTasks = async (req, res) => {
  if (req.query.query === 'all') {
    try {
      const allTasks = await prisma.task.findMany({
        orderBy: [{ id: 'desc' }],
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
      const tasksWithUpdatedBy = await Promise.all(allTasks.map(async task => {
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
      }));
      
      

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

    return res.status(404).json({ message: 'Task not found or assignedBy user not available.' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};


const getTaskByuserId = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const taskStatus = req.query.taskStatus;  // Extract taskStatus from query

    let taskFilter = {};
    if (taskStatus === 'PENDING' || taskStatus === 'INPROGRESS'|| taskStatus === 'COMPLETED') {
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
            department:true,
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
    message:"Task deleted successfully"});
  } catch (error) {
    return res.status(400).json({ message:"Failed to delete task" });
  }
};

const getAlluserHirarchy = async (req, res) => {
  const userId = parseInt(req.query.userId); 
  const { skip, limit, status } = req.query;

  let users = [];

  try {
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid userId provided' });
    }
    const fetchUsers = async (referenceId, userIdToExclude) => {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { reference_id: referenceId },
            { referenceid_two: referenceId }
          ],
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
    for (let x of usersData){
      array.push(x.id);
    }
    console.log(array);

    const leave = await prisma.user.findMany({
      where: {
        id: { in: array }
      },
      orderBy: [
        {
          id: "desc",
        },
      ],
      
    });


    
    return res.status(200).json(
      leave,
      // array
      );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
async function sendNotify(title, body, desc, tokens) {
  try {
    const messages = tokens.map((token) => ({
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

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(`Notification sent to token ${tokens[index]}`);
      } else {
        console.log(
          `Failed to send notification to token ${tokens[index]}: ${result.reason}`
        );
      }
    });

  } catch (error) {
    console.error("Error sending notifications:", error);
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
