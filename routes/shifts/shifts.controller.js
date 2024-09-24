const { getPagination } = require("../../utils/query");
const prisma = require("../../utils/prisma");
const moment = require("moment");
const { schedule } = require("node-cron");
const e = require("cors");
const admin = require("firebase-admin");
var FCM = require("fcm-node");
const time_zone = process.env.timezone
// const createShift = async (req, res) => {
//   try {
//     const userId = req.body.userId;
    // const shiftDate = moment(req.body.shiftFrom).format('YYYY-MM-DD');
    // const user = await prisma.user.findUnique({
    //   where: {
    //     id: userId,
    //   },
    //   include: {
    //     shifts: {
    //       include: {
    //         schedule: true,
    //       },
    //     },
    //   },
    // });
    // // console.log(user);
    // if (user) {
    //   // Iterate over the user's shifts and schedules to check for existing shiftDate and status
    //   for (const shift of user.shifts) {
    //     for (const schedule of shift.schedule) {
    //       const scheduleDate = moment(schedule.shiftDate).format('YYYY-MM-DD');
    //       // console.log(scheduleDate);
    //       if (scheduleDate === shiftDate && schedule.status === true) {
    //         return res.status(400).json({ message: "User already has a shift for this date" });
    //       }
    //     }
    //   }
    // }

//     const timeDiff = moment(req.body.endTime).diff(moment(req.body.startTime));
//     const totalMinutes = timeDiff / (1000 * 60);
//     const hours = Math.floor(totalMinutes / 60);
//     const minutes = totalMinutes % 60;
//     const workHour = parseFloat(`${hours}.${(minutes < 10 ? '0' : '')}${minutes.toFixed(2)}`);

//     let displayValue;
//     if (workHour < 1) {
//       displayValue = `${minutes} min`;
//     } else {
//       displayValue = `${workHour} hr`;
//     }

//     const createShiftData = {
//       name: req.body.name,
//       shiftFrom: new Date(req.body.shiftFrom),
//       shiftTo: new Date(req.body.shiftTo),
//       weekNumber: req.body.weekNumber,
//       userId: req.body.userId,
//       locationId: req.body.locationId,
//       assignedBy: req.auth.sub,
//       status: req.body.status,
//       generalInfo: req.body.generalInfo,
//       schedule: req.body.schedule ? {
//         create: req.body.schedule.map((e) => {
//           const scheduleData = {
//             day: e.day,
//             shiftDate: e.shiftDate,
//             startTime: e.startTime ? new Date(e.startTime) : null,
//             endTime: e.endTime ? new Date(e.endTime) : null,
//             breakTime: e.breakTime ? e.breakTime : null,
//             roomId: e.roomId ? e.roomId : null,
//             folderTime: e.folderTime ? e.folderTime : null,
//             status: e.status

//           };

          // if (e.startTime && e.endTime) {
          //   const timeDiff = moment(e.endTime).diff(moment(e.startTime));
          //   const totalMinutes = timeDiff / (1000 * 60);
          //   const hours = Math.floor(totalMinutes / 60);
          //   const minutes = totalMinutes % 60;
          //   const workHour = parseFloat(`${hours}.${(minutes < 10 ? '0' : '')}${minutes.toFixed(2)}`);
          //   scheduleData.workHour = workHour;
          // } else {
          //   scheduleData.workHour = null;
          // }

//           return scheduleData;
//         }),
//       } : {},
//     };

//     const createShiftResult = await prisma.shifts.create({
//       data: createShiftData,
//     });
//     const Title = 'Shift added';
//     const Body = 'Your shift has been added';
//     const Desc = 'Shift marked notification';
//     const Token = user.firebaseToken;
//     // const Device = user.device;
//     console.log(Title, Body, Desc, Token);
//     sendnotifiy(Title, Body, Desc, Token);
//     return res.status(200).json({ createShift: createShiftResult, message: "Shift created successfully" });
//   } catch (error) {
//     console.error(error);
//     return res.status(400).json({ message: 'Failed to create shift' });
//   }
// };
const createShift = async (req, res) => {
  try {
    // Extract necessary data from the request
    const { userId, shiftFrom, shiftTo, name, weekNumber, locationId, status, generalInfo, schedule } = req.body;

    // Ensure userId is an array
    const userIdArray = Array.isArray(userId) ? userId : [userId];
    if (userIdArray.length === 0) {
      return res.status(400).json({ message: "Please select at least one user" });
    }

    // Iterate over the user IDs
    for (const userId of userIdArray) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          shifts: {
            include: { schedule: true },
          },
        },
      });

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // Check for existing shift in the same week
      user.shifts.forEach((shift) => {
        if (shift.weekNumber == weekNumber) {
          throw new Error(`Shift already added for this week.`);
        }
      });

      // Check for conflicting shifts on the same date
      const conflictingUserNames = [];

      for (const shift of user.shifts) {
        for (const schedule of shift.schedule) {
          const scheduleDate = moment.utc(schedule.shiftDate).format('YYYY-MM-DD');
          const shiftFromDate = moment.utc(shiftFrom).format('YYYY-MM-DD');
          if (scheduleDate === shiftFromDate && schedule.status === true) {
            conflictingUserNames.push(user.firstName);
            break;
          }
        }
      }

      if (conflictingUserNames.length > 0) {
        const errorMessage = `Users ${conflictingUserNames.join(', ')} already have shifts for this date`;
        return res.status(400).json({ message: errorMessage });
      }
    }

    // Calculate work hours based on shiftFrom and shiftTo in UTC
    const shiftFromUTC = moment.utc(shiftFrom);
    const shiftToUTC = moment.utc(shiftTo);
    const timeDiff = shiftToUTC.diff(shiftFromUTC);
    const totalMinutes = timeDiff / (1000 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const workHour = parseFloat(`${hours}.${(minutes < 10 ? '0' : '')}${minutes.toFixed(0)}`);

    // Create shift data object
    const createShiftData = {
      name,
      shiftFrom: shiftFromUTC.toDate(),
      shiftTo: shiftToUTC.toDate(),
      weekNumber,
      locationId,
      assignedBy: req.auth.sub,
      status,
      generalInfo,
      schedule: schedule
          ? {
            create: schedule.map((e) => {
              // Parse startTime and endTime as UTC, regardless of server's time zone
              const startTimeUTC = e.startTime ? moment.parseZone(e.startTime).utc().toDate() : null;
              const endTimeUTC = e.endTime ? moment.parseZone(e.endTime).utc().toDate() : null;

              const scheduleData = {
                day: e.day,
                shiftDate: moment.utc(e.shiftDate).toDate(),
                startTime: startTimeUTC,
                endTime: endTimeUTC,
                breakTime: e.breakTime || null,
                roomId: e.roomId || null,
                folderTime: e.folderTime || null,
                status: e.status,
                workHour: null,
              };

              // Calculate workHour for the schedule
              if (startTimeUTC && endTimeUTC) {
                const startTimeMoment = moment.utc(startTimeUTC);
                const endTimeMoment = moment.utc(endTimeUTC);
                const timeDiff = endTimeMoment.diff(startTimeMoment);
                const totalMinutes = timeDiff / (1000 * 60);
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                scheduleData.workHour = parseFloat(
                    `${hours}.${minutes < 10 ? '0' : ''}${minutes.toFixed(0)}`
                );
              }

              return scheduleData;
            }),
          }
          : {},
    };

    // Create shifts for each user
    const createShiftResults = await Promise.all(
        userIdArray.map(async (userId) => {
          const result = await prisma.shifts.create({
            data: { ...createShiftData, userId },
          });
          return result;
        })
    );

    // Send notifications to users
    const usersForNotification = await prisma.user.findMany({
      where: {
        id: {
          in: userIdArray,
        },
        status: true,
      },
    });

    const tokensForNotification = usersForNotification
        .map((user) => user.firebaseToken)
        .filter((token) => token !== null);

    if (tokensForNotification.length > 0) {
      const Title = 'Shift added';
      const Body = 'Your shift has been added';
      const Desc = 'Shift marked notification';
      sendNotify(Title, Body, Desc, tokensForNotification);
    }

    return res.status(200).json({ createShift: createShiftResults, message: 'Shifts created successfully' });
  } catch (error) {
    if (!res.headersSent) {
      return res.status(400).json({ message: error.message });
    }
  }
};

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return  weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);

}

const getAllShift = async (req, res) => {
  try {
    const { shiftFrom, shiftTo } = req.query;
    const isDateRangeProvided = shiftFrom && shiftTo;

    let allShifts;
    if (isDateRangeProvided) {
      const startDateTime = new Date(shiftFrom);
      const endDateTime = new Date(shiftTo);
      endDateTime.setHours(23, 59, 59, 999);
      allShifts = await prisma.shifts.findMany({

        where: {

          AND: [
            {
              shiftFrom: {
                lte: endDateTime,
              },
            },
            {
              shiftTo: {
                gte: startDateTime,
              },
            },
          ],
        },
        orderBy: [{ id: "desc" }],
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
              folderTime: true,
              shiftDate: true,
              room: {
                select: {
                  roomName: true,
                },
              },
              workHour: true,
              status: true,
              shiftsId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    }
    else {
      const today = new Date();
      const currentWeek = getWeekNumber(today);
      startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 99)
      allShifts = await prisma.shifts.findMany({
        where: {
          weekNumber: currentWeek, // Filter by current week number
          // AND: [
          //   {
          //     shiftFrom: {
          //       lte: endOfToday,
          //     },
          //   },
          //   {
          //     shiftTo: {
          //       gte: startOfToday,
          //     },
          //   },
          // ],
        },
        orderBy: {
          id: "desc",
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
          schedule: {
            select: {
              id: true,
              day: true,
              startTime: true,
              endTime: true,
              breakTime: true,
              folderTime: true,
              room: {
                select: {
                  roomName: true,
                },
              },
              workHour: true,
              status: true,
              shiftsId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    }
    console.log(allShifts.schedule)
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

const getAllShiftmobile = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let startOfDate, endOfDate;

    if (startDate && endDate) {
      startOfDate = new Date(startDate);
      endOfDate = new Date(endDate);
      endOfDate.setHours(23, 59, 59, 999);

      const shiftsWithSchedules = await prisma.shifts.findMany({
        where: {
          schedule: {
            some: {
              shiftDate: {
                gte: startOfDate.toISOString().slice(0, 10),
                lte: endOfDate.toISOString().slice(0, 10)
              },
              status: true,
            }
          }
        },
        orderBy: [{ id: "desc" }],
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
            where: {
              shiftDate: {
                gte: startOfDate.toISOString().slice(0, 10),
                lte: endOfDate.toISOString().slice(0, 10)
              },
              status: true,
            },
            select: {
              id: true,
              day: true,
              startTime: true,
              endTime: true,
              breakTime: true,
              folderTime: true,
              shiftDate: true,
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
              workHour: true,
              status: true,
              shiftsId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      return res.status(200).json(shiftsWithSchedules);
    } else {
      return res.status(400).json({ message: "Please provide valid startDate and endDate." });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
            employeeId: true,
            designationHistory: {
              include: {
                designation: true,
              },
              orderBy: {
                startDate: 'desc', // Order by start date in ascending order
              },
            },
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
            folderTime: true,
            shiftDate: true,
            room: {
              select: {
                id: true,
                roomName: true,
              },

            },
            workHour: true,
            status: true,
            shiftsId: true,
            // generalInfo:true,
            createdAt: true,
            updatedAt: true,

          },

        }

      },
    });
    if (!singleShift) {
      return res.status(400).json({ message: "Shift not found" })
    }
    const daysOrder = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 7,
    };
    if (singleShift && singleShift.schedule) {
      // Sort the days based on custom order
      singleShift.schedule.sort((a, b) => daysOrder[a.day] - daysOrder[b.day]);
    }
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
  const { startDate, endDate } = req.query;
  let startOfDate, endOfDate;

  if (startDate && endDate) {
    startOfDate = new Date(startDate);
    endOfDate = new Date(endDate);
    endOfDate.setHours(23, 59, 59, 999);
  }


  try {
    const userId = parseInt(req.params.id);

    const singleShift = await prisma.shifts.findMany({
      where: {
        userId: userId,
        schedule: {
          some: {
            shiftDate: {
              gte: startOfDate.toISOString().slice(0, 10),
              lte: endOfDate.toISOString().slice(0, 10)
            },
            status: true,
          }
        }
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

        schedule: {
          where: {
            shiftDate: {
              gte: startOfDate.toISOString().slice(0, 10),
              lte: endOfDate.toISOString().slice(0, 10)
            },
            status: true,

          },
          select: {
            id: true,
            day: true,
            startTime: true,
            endTime: true,
            breakTime: true,
            folderTime: true,
            shiftDate: true,
            room: {
              select: {
                id: true,
                location: {
                  select: {
                    id: true,
                    latitude: true,
                    longitude: true,
                    locationName: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
                roomName: true,
                status: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            workHour: true,
            status: true,
            shiftsId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (singleShift && singleShift.length > 0) {
      for (let shift of singleShift) {
        if (shift.assignedBy) {
          const assignedByUser = await prisma.user.findUnique({
            where: { id: shift.assignedBy },
            select: { id: true, firstName: true, lastName: true, userName: true },
          });
          shift.assignedBy = assignedByUser;
        }
      }
      return res.status(200).json(singleShift);
    } else {
      return res.status(200).json([]);
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
};

const updateSingleShift = async (req, res) => {
  try {
    console.log("Updating shift");
    const shiftId = Number(req.params.id);
    const userId = req.body.userId;

    // Fetch the user and their shifts
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        shifts: {
          include: {
            schedule: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Parse shiftFrom and shiftTo as UTC
    const shiftFromUTC = moment.utc(req.body.shiftFrom).toDate();
    const shiftToUTC = moment.utc(req.body.shiftTo).toDate();

    // Update the shift with times in UTC
    const updatedShift = await prisma.shift.update({
      where: {
        id: shiftId,
      },
      data: {
        name: req.body.name,
        shiftFrom: shiftFromUTC,
        shiftTo: shiftToUTC,
        weekNumber: req.body.weekNumber,
        generalInfo: req.body.generalInfo,
        userId: req.body.userId,
        locationId: req.body.locationId,
        assignedBy: req.auth.sub,
        status: true,
      },
    });

    if (req.body.schedule) {
      for (const scheduleItem of req.body.schedule) {
        // Parse startTime and endTime as UTC
        const startTimeUTC = scheduleItem.startTime
            ? moment.parseZone(scheduleItem.startTime).utc()
            : null;
        const endTimeUTC = scheduleItem.endTime
            ? moment.parseZone(scheduleItem.endTime).utc()
            : null;

        // Calculate workHour if both times are available
        let workHour = null;
        if (startTimeUTC && endTimeUTC) {
          const timeDiff = endTimeUTC.diff(startTimeUTC); // Difference in milliseconds
          const totalMinutes = timeDiff / (1000 * 60); // Convert milliseconds to minutes
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          workHour = parseFloat(
              `${hours}.${minutes < 10 ? '0' : ''}${minutes.toFixed(0)}`
          );
        }

        // Update the schedule with times in UTC
        await prisma.schedule.update({
          where: {
            id: scheduleItem.id,
          },
          data: {
            day: scheduleItem.day,
            shiftDate: moment.utc(scheduleItem.shiftDate).toDate(),
            startTime: startTimeUTC ? startTimeUTC.toDate() : null,
            endTime: endTimeUTC ? endTimeUTC.toDate() : null,
            breakTime: scheduleItem.breakTime || null,
            roomId: scheduleItem.roomId || null,
            folderTime: scheduleItem.folderTime || null,
            status: scheduleItem.status,
            workHour: workHour,
          },
        });
      }
    }

    // Send notification to the user
    const Title = 'Shift Updated';
    const Body = 'Your shift has been updated';
    const Desc = 'Shift marked notification';
    const Token = user.firebaseToken;

    console.log(Title, Body, Desc, Token);
    sendNotify(Title, Body, Desc, Token);

    return res.status(200).json({
      updatedShift,
      message: "Shift updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: 'Failed to update shift', error: error.message });
  }
};


const deleteSingleShift = async (req, res) => {
  try {
    const shiftId = parseInt(req.params.id);

    // Fetch shift and associated schedules
    const existingShift = await prisma.shifts.findUnique({
      where: { id: shiftId },
      include: {
        schedule: {
          include: {
            request: true, // Include requests associated with the schedule
          },
        },
      },
    });

    if (!existingShift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    // Delete requests associated with the schedules of the shift
    const deleteRequests = await prisma.request.deleteMany({
      where: { FromScheduleId: { in: existingShift.schedule.map(schedule => schedule.id) } },
    });

    // Delete schedules associated with the shift
    const deleteSchedules = await prisma.schedule.deleteMany({
      where: { shiftsId: shiftId },
    });

    // Delete the shift
    const deleteShift = await prisma.shifts.delete({
      where: { id: shiftId },
    });

    return res.status(200).json({
      deleteShift,
      deleteSchedules,
      deleteRequests,
      message: "Shift, associated schedules, and requests deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "Failed to delete shift, schedules, and requests." });
  }
};


const swapSingleShift = async (req, res) => {
  try {
    const scheduleItemId1 = Number(req.body.scheduleItemId1);
    const scheduleItemId2 = Number(req.body.scheduleItemId2);

    const scheduleItem1 = await prisma.schedule.findUnique({
      where: {
        id: scheduleItemId1,
      },
    });

    const scheduleItem2 = await prisma.schedule.findUnique({
      where: {
        id: scheduleItemId2,
      },
    });

    if (!scheduleItem1 || !scheduleItem2) {
      return res.status(400).json({ message: 'One or both schedule items were not found.' });
    }

    const shiftsId1 = scheduleItem1.shiftsId;
    const shiftsId2 = scheduleItem2.shiftsId;

    await prisma.schedule.update({
      where: { id: scheduleItemId1 },
      data: {
        shiftsId: shiftsId2,
      },
    });

    await prisma.schedule.update({
      where: { id: scheduleItemId2 },
      data: {
        shiftsId: shiftsId1,
      },
    });

    return res.status(200).json({
      message: 'Rooms swapped successfully',
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: 'Failed to update schedule items' });
  }
};

const swapSingleShiftRequest = async (req, res) => {
  try {
    const scheduleItemId1 = Number(req.body.scheduleItemId1);
    const scheduleItemId2 = Number(req.body.scheduleItemId2);

    const scheduleItem1 = await prisma.schedule.findUnique({
      where: {
        id: scheduleItemId1,
      },
    });

    const scheduleItem2 = await prisma.schedule.findUnique({
      where: {
        id: scheduleItemId2,
      },
    });

    if (!scheduleItem1 || !scheduleItem2) {
      return res.status(400).json({ message: 'One or both schedule items were not found.' });
    }

    const shiftsId1 = scheduleItem1.shiftsId;
    const shiftsId2 = scheduleItem2.shiftsId;

    await prisma.schedule.update({
      where: { id: scheduleItemId1 },
      data: {
        shiftsId: shiftsId2,
      },
    });

    await prisma.schedule.update({
      where: { id: scheduleItemId2 },
      data: {
        shiftsId: shiftsId1,
      },
    });

    return res.status(200).json({
      message: 'Rooms swapped successfully',
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: 'Failed to update schedule items' });
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
  createShift,
  getAllShift,
  getSingleShift,
  updateSingleShift,
  deleteSingleShift,
  getSingleShiftbyuserId,
  swapSingleShift,
  swapSingleShiftRequest,
  getAllShiftmobile,
};
