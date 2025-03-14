const { getPagination } = require("../../utils/query");
const prisma = require("../../utils/prisma");
const admin = require("firebase-admin");
var FCM = require("fcm-node");
const { DECIMAL } = require("sequelize");
const sendEmail = require("../../utils/emails");

//shift exchange request
const addrequest = async (req, res) => {
  try {
    const { FromScheduleId, ToScheduleId, userId } = req.body;

    const fromSchedule = await prisma.schedule.findUnique({
      where: { id: FromScheduleId },
      include: {
        shifts: {
          include: {
            user: {
              select: {
                id: true,
                location: true, // Assuming 'location' is a field in the 'user' model
                firebaseToken: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    const toSchedule = await prisma.schedule.findUnique({
      where: { id: ToScheduleId },
      include: {
        shifts: {
          include: {
            user: {
              select: {
                id: true,
                location: true, // Assuming 'location' is a field in the 'user' model
                firebaseToken: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
    const fromUser = fromSchedule.shifts.user;
    const userwithrole = await prisma.user.findMany({
      where: {
        OR: [
          { id: user.reference_id }, // Match the reference_id
          { reference_id: null }, // Match null reference_id
        ],
        NOT: {
          id: 1, // Exclude users with id = 1
        },
      },
    });
    console.log(userwithrole, "userwithrole");
    const toUser = toSchedule.shifts.user;

    if (
      fromUser.location.latitude !== toUser.location.latitude ||
      fromUser.location.longitude !== toUser.location.longitude
    ) {
      return res
        .status(400)
        .json({ message: "Request not created locations are different." });
    }
    // return
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
      return res
        .status(400)
        .json({ message: "Request already exists for same shift." });
    }
    if (
      fromSchedule.shiftDate === toSchedule.shiftDate &&
      (fromStartTime !== toStartTime || fromEndTime !== toEndTime)
    ) {
      const createRequestResult = await prisma.request.create({
        data: {
          FromScheduleId,
          ToScheduleId,
          userId,
        },
      });
      const Title = "Swap Request";
      const Body = "Your request has been added";
      const Desc = "Request notification";
      const fromToken = fromUser.firebaseToken;
      const Title1 = "Swap Request";
      const Body1 =
        fromUser.firstName +
        " " +
        fromUser.lastName +
        "\n" +
        "Date:" +
        fromSchedule.shiftDate;
      const Desc1 = "Request notification"; // Replace with the actual field containing the Firebase token
      const toToken = toUser.firebaseToken;
      // const Device = user.device;

      await sendnotifiy(Title, Body, Desc, fromToken);
      await sendnotifiy1(Title1, Body1, Desc1, toToken);
      console.log(Title, Body, Desc, fromToken, "fromtoken");
      console.log(Title1, Body1, Desc1, toToken, "totoken");
      for (const users of userwithrole) {
        // Use "of" instead of "in"
        if (users.id !== user.id) {
          // Compare with "user.id"
          console.log(users.email, "users");
          await sendEmail("swaprequest", {
            email: userwithrole.email,
            fromfirstName: fromUser.firstName,
            fromlastName: fromUser.lastName,
            tofirstName: toUser.firstName,
            tolastName: toUser.lastName,
            swapdate: fromSchedule.shiftDate,
            submittiondate: new Date().toDateString(),
            adminFirstName: userwithrole.firstName,
            adminLastName: userwithrole.lastName,
          });
        }
      }
      return res.status(200).json({
        createRequest: createRequestResult,
        message: "Request created successfully.",
      });
    } else {
      return res.status(400).json({
        message: "Failed to create request shift, start & end time are same.",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "Failed to create a request." });
  }
};
//get single request
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
        reason: true,
        userId: true,
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
        shiftDate: true,
        breakTime: true,
        folderTime: true,
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
    });

    const scheduleTo = await prisma.schedule.findUnique({
      where: { id: singleShift.ToScheduleId },
      select: {
        id: true,
        day: true,
        startTime: true,
        endTime: true,
        shiftDate: true,
        breakTime: true,
        folderTime: true,
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
            image: true,
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
            image: true,

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
      orderBy: [{ id: "desc" }],
      select: {
        id: true,
        FromScheduleId: true,
        ToScheduleId: true,
        requststatus: true,
        reason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const allRequestsWithDetails = [];

    for (const singleShift of allRequests) {
      const scheduleFromId = singleShift.FromScheduleId;
      const scheduleToId = singleShift.ToScheduleId;

      if (scheduleFromId !== null && scheduleToId !== null) {
        const scheduleFrom = await prisma.schedule.findUnique({
          where: { id: singleShift.FromScheduleId },
          select: {
            id: true,
            day: true,
            startTime: true,
            endTime: true,
            shiftDate: true,
            breakTime: true,
            folderTime: true,
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
        });

        const scheduleTo = await prisma.schedule.findUnique({
          where: { id: singleShift.ToScheduleId },
          select: {
            id: true,
            day: true,
            startTime: true,
            endTime: true,
            shiftDate: true,
            breakTime: true,
            folderTime: true,
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
                image: true,
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
                image: true,
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
    }
    return res.status(200).json(allRequestsWithDetails);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
//get single request by userid
const getSingleuserrequest = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { startDate, endDate } = req.query;
    let startOfDate, endOfDate;

    if (startDate && endDate) {
      startOfDate = new Date(startDate);
      endOfDate = new Date(endDate);
      endOfDate.setHours(23, 59, 59, 999);
    }

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
      // Check if FromScheduleId is not null before querying the schedule
      if (shift.FromScheduleId !== null) {
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

        // Check if scheduleFrom is not null before pushing to the array
        if (scheduleFrom) {
          const scheduleTo = await prisma.schedule.findUnique({
            where: { id: shift.ToScheduleId },
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

          shiftsWithSchedulesAndUsers.push({
            ...shift,
            scheduleFrom: scheduleFrom,
            scheduleTo: scheduleTo,
          });
        }
      }
    }

    return res.status(200).json(shiftsWithSchedulesAndUsers);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
const updateSchedules = async (fromScheduleId, toScheduleId) => {
  const fromSchedule = await prisma.schedule.findUnique({
    where: { id: fromScheduleId },
  });

  const toSchedule = await prisma.schedule.findUnique({
    where: { id: toScheduleId },
  });

  if (fromSchedule && toSchedule) {
    const fromScheduleData = { ...fromSchedule };
    const toScheduleData = { ...toSchedule };

    // Swap schedule attributes except for the 'ID'
    const tempShiftsId = fromScheduleData.shiftsId;

    fromScheduleData.shiftsId = toSchedule.shiftsId;
    toScheduleData.shiftsId = tempShiftsId;

    await prisma.schedule.update({
      where: { id: fromScheduleId },
      data: fromScheduleData,
    });

    await prisma.schedule.update({
      where: { id: toScheduleId },
      data: toScheduleData,
    });
  }
};

const swaprequest = async (req, res) => {
  try {
    const { userId, requststatus, reason } = req.body;

    const existingRequest = await prisma.request.findFirst({
      where: {
        userId: userId,
      },
      include: {
        schedule: {
          include: {
            shifts: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!existingRequest) {
      return res.status(400).json({ message: "Shift swap request not found." });
    }

    let updatedRequest;

    switch (existingRequest.requststatus) {
      case "PENDING":
        if (requststatus === "APPROVED") {
          updatedRequest = await prisma.request.update({
            where: { id: existingRequest.id },
            data: {
              FromScheduleId: existingRequest.ToScheduleId,
              ToScheduleId: existingRequest.FromScheduleId,
              requststatus: "APPROVED",
            },
          });
          const Title = "Swap Request Approved";
          const Body = "Your request has been approved";
          const Desc = "Request notification";
          const fromToken = existingRequest.schedule.shifts.user.firebaseToken;
          const Title1 = "Swap Request Approved";
          const Body1 =
            existingRequest.schedule.shifts.user.firstName +
            " " +
            existingRequest.schedule.shifts.user.lastName;
          const Desc1 = "Request notification"; // Replace with the actual field containing the Firebase token
          const toToken = existingRequest.schedule.shifts.user.firebaseToken;
          // const Device = user.device;

          await sendnotifiy(Title, Body, Desc, fromToken);
          await sendnotifiy1(Title1, Body1, Desc1, toToken);
          console.log(Title, Body, Desc, fromToken, "fromtoken");
          console.log(Title1, Body1, Desc1, toToken, "totoken");
          await updateSchedules(
            existingRequest.ToScheduleId,
            existingRequest.FromScheduleId
          );
        } else if (requststatus === "REJECTED") {
          updatedRequest = await prisma.request.update({
            where: { id: existingRequest.id },
            data: {
              requststatus: "REJECTED",
              reason: reason,
            },
          });
        }
        break;
      case "APPROVED":
        if (requststatus === "REJECTED") {
          updatedRequest = await prisma.request.update({
            where: { id: existingRequest.id },
            data: {
              FromScheduleId: existingRequest.ToScheduleId,
              ToScheduleId: existingRequest.FromScheduleId,
              requststatus: "REJECTED",
              reason: reason,
            },
          });
          const Title = "Swap Request Rejected";
          const Body = "Your request has been rejected";
          const Desc = "Request notification";
          const fromToken = existingRequest.schedule.shifts.user.firebaseToken;
          const Title1 = "Swap Request Rejected";
          const Body1 =
            existingRequest.schedule.shifts.user.firstName +
            " " +
            existingRequest.schedule.shifts.user.lastName;
          const Desc1 = "Request notification"; // Replace with the actual field containing the Firebase token
          const toToken = existingRequest.schedule.shifts.user.firebaseToken;
          // const Device = user.device;

          await sendnotifiy(Title, Body, Desc, fromToken);
          await sendnotifiy1(Title1, Body1, Desc1, toToken);
          console.log(Title, Body, Desc, fromToken, "fromtoken");
          console.log(Title1, Body1, Desc1, toToken, "totoken");
          await updateSchedules(
            existingRequest.ToScheduleId,
            existingRequest.FromScheduleId
          );
        }
        break;
      case "REJECTED":
        if (requststatus === "APPROVED") {
          updatedRequest = await prisma.request.update({
            where: { id: existingRequest.id },
            data: {
              FromScheduleId: existingRequest.ToScheduleId,
              ToScheduleId: existingRequest.FromScheduleId,
              requststatus: "APPROVED",
            },
          });
          const Title = "Swap Request";
          const Body = "Your request has been approved";
          const Desc = "Request notification";
          const fromToken = existingRequest.schedule.shifts.user.firebaseToken;
          const Title1 = "Swap Request Approved";
          const Body1 =
            existingRequest.schedule.shifts.user.firstName +
            " " +
            existingRequest.schedule.shifts.user.lastName;
          const Desc1 = "Request notification"; // Replace with the actual field containing the Firebase token
          const toToken = existingRequest.schedule.shifts.user.firebaseToken;
          // const Device = user.device;

          await sendnotifiy(Title, Body, Desc, fromToken);
          await sendnotifiy1(Title1, Body1, Desc1, toToken);
          console.log(Title, Body, Desc, fromToken, "fromtoken");
          console.log(Title1, Body1, Desc1, toToken, "totoken");
          await updateSchedules(
            existingRequest.ToScheduleId,
            existingRequest.FromScheduleId
          );
        }
        break;
      default:
        return res.status(400).json({ message: "Invalid request status" });
    }

    return res.status(200).json({
      updatedRequest,
      message: `Shift swap request status is changed to ${requststatus}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "Failed to update request" });
  }
};
const deleteRequest = async (req, res) => {
  try {
    const deleteRequest = await prisma.request.delete({
      where: {
        id: Number(req.params.id),
      },
    });
    return res.status(200).json({
      message: "Request deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({ message: "Failed to delete Request" });
  }
};
function sendnotifiy(Title, Body, Desc, fromToken) {
  try {
    const message = {
      notification: {
        title: Title,
        body: Body,
        // desc:Desc
      },
      token: fromToken,
    };
    admin
      .messaging()
      .send(message)
      .then((response) => {
        console.log("Notification Send ....");
      })
      .catch((error) => {
        console.log("Error sending notification:", error);
      });
  } catch (error) {
    console.log("Error:", error);
  }
}
function sendnotifiy1(Title1, Body1, Desc1, toToken) {
  try {
    const message = {
      notification: {
        title: Title1,
        body: Body1,
        // desc:Desc1,
      },
      token: toToken,
    };
    admin
      .messaging()
      .send(message)
      .then((response) => {
        console.log("Notification Send ....");
      })
      .catch((error) => {
        console.log("Error sending notification:", error);
      });
  } catch (error) {
    console.log("Error:", error);
  }
}
module.exports = {
  addrequest,
  getSinglerequest,
  getAllrequest,
  getSingleuserrequest,
  swaprequest,
  deleteRequest,
};
