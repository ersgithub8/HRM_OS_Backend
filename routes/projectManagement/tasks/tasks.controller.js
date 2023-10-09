const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");
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
    const userIds = req.body.userId;  // Array of user IDs
    const tasks = [];

    // Create the task
    const newTask = await prisma.task.create({
      data: {
        name: req.body.name,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        assignedBy: req.body.assignedBy||null,
        description: req.body.description,
        completionTime: parseFloat(req.body.completionTime),
        adminattachment: req.body.adminattachment,
        userAttachment: req.body.userAttachment,
        reviewComment:req.body.reviewComment,
        priority: {
          connect: {
            id: req.body.priorityId,
          },
        },
      },
    });

    // Assign the task to each user
    for (const userId of userIds) {
      const userTaskAssignment = await prisma.userTaskAssignment.create({
        data: {
          userId: userId,
          taskId: newTask.id,  // Associate the task with the user
        },
      });

      tasks.push({
        taskId: newTask.id,
        userId: userId,
        assignmentId: userTaskAssignment.id,
      });
    }

    return res.status(200).json({
      tasks,
      message: "Task created successfully",
    });
  } catch (error) {
    return res.status(400).json({ message: "Failed to create task and assign to users" });
  }
};


//get all tasks controller
const getAllTasks = async (req, res) => {
  if (req.query.query === "all") {
    try {
      const allTasks = await prisma.task.findMany({
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
            employeeId: true,
          },
        },
        priority: {
          select: {
            id: true,
            name: true,
          },
        },
      }
      
      });
      return res.status(200).json(allTasks);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.status === "true") {
    try {
      const allTasks = await prisma.task.findMany({
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
            employeeId: true,
        
          },
        },
        
      },
        where: {
          status: true,
        },
      });
      return res.status(200).json(allTasks);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.status === "false") {
    try {
      const allTasks = await prisma.task.findMany({
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
            employeeId: true,
            priority:true

          },
        },
      },
        where: {
          status: false,
        },
      });
      return res.status(200).json(allTasks);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

//get task by id controller
const getTaskById = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: {
        id: Number(req.params.id),
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
        priority: {
          select: {
            id: true,
            name: true,
          },
        },
      }
    });
    return res.status(200).json(task);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
const getTaskByuserId = async (req, res) => {
  try {
    const singletask = await prisma.task.findMany({
      where: {
        AND: {
          userId: Number(req.params.id),
        },
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
        
        priority: {
          select: {
            id: true,
            name: true,
          },
      },
      },
      orderBy: [
        {
          id: "desc",
        },
      ],
    });

    if (singletask.length === 0)
      return res.status(200).json({ message: "No task found for this user" });

    const singleusertask = await Promise.all(
      singletask.map(async (leave) => {
        let approvedByUser = null;
        if (leave.acceptLeaveBy) {
          approvedByUser = await prisma.user.findUnique({
            where: {
              id: leave.acceptLeaveBy,
            },
          });
        }

        return {
          ...leave,
          approvedBy: approvedByUser,
        };
      })
    );

 
   

    

    return res.status(200).json({
      singleusertask,
    
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//update task controller
const updateTask = async (req, res) => {
  
    try {
      const updatedTask = await prisma.task.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          status: req.body.status,
        },
      });
      return res.status(200).json({updatedTask,
      message:"Task updated successfully"});
    } catch (error) {
      return res.status(400).json({ message: "Fialed to update task" });
    }
  }


//delete task controller
const deleteTask = async (req, res) => {
  try {
    const deletedTask = await prisma.task.delete({
      where: {
        id: Number(req.params.id),
      },
    });
    return res.status(200).json(deletedTask);
  } catch (error) {
    return res.status(400).json({ message: error.message });
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

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getAlluserHirarchy,
  getTaskByuserId,
};
