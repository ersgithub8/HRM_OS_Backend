const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");
const moment = require("moment");
const admin = require("firebase-admin");
var FCM = require("fcm-node");
//create a new announement
const createSingleTraining = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many training at once
      const deletetraining = await prisma.training.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });
      return res.status(200).json(deletetraining);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }else {
    try {
      const leaveFrom = new Date(req.body.leaveFrom);
      // leaveFrom.setHours(0,0,0,0)
      const leaveTo = new Date(req.body.leaveTo);
      const overlappingTraining = await prisma.training.findFirst({
        where: {
          OR: [
            {
              leaveFrom: { lte: leaveTo },
              leaveTo: { gte: leaveFrom },
            },
          ],
        },
      });
    console.log(overlappingTraining);
      if (overlappingTraining) {
        return res.status(400).json({ message: "Training day already exists within this date range." });
      }
     
      const createdTraining = await prisma.training.create({
        data: {
          day: req.body.day,
          leaveFrom: leaveFrom,
          leaveTo:leaveTo,
        },
      });
      const user = await prisma.user.findMany({ where: { status: true } })
      // console.log(user);
      const tokenArray = user.map(item => item.firebaseToken ? item.firebaseToken : null);
      const newTokens = tokenArray.filter(item => item !== null)

      const Title = "Training Added";
      const Body = "From"+req.body.leaveFrom+"To"+req.body.leaveTo

      const Desc = 'Training notification';
      // const Device = user.device;
      console.log(Title, Body, Desc, newTokens);
      sendNotify(Title, Body, Desc, newTokens);
      return res.status(200).json({
        createdTraining,
        message:"Training added successfully"
      });
    } catch (error) {
      return res.status(400).json({ message: "Failed to add training" });
    }
  }
};
const getAllTrining = async (req, res) => {
  if (req.query.query === "all") {
    const allTraining = await prisma.training.findMany({
      orderBy: [
        {
          id: "desc",
        },
      ],
    });
    return res.status(200).json(allTraining);
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allTraining = await prisma.training.findMany({
        orderBy: [
          {
            id: "desc",
          },

        ],
        skip: Number(skip),
        take: Number(limit),
        
      });
      return res.status(200).json(allTraining);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};
const getSingleTrining = async (req, res) => {
  try {
    const singleTraing = await prisma.training.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });


    return res.status(200).json(singleTraing);
  } catch (error) {
    return res.status(400).json({ message: "Failed to get training" });
  }
};
const updateSingleTrining = async (req, res) => {
  try {
    const leaveFrom = new Date(req.body.leaveFrom);
      // leaveFrom.setHours(0,0,0,0)
      const leaveTo = new Date(req.body.leaveTo);
    const updatedTraining = await prisma.training.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        day: req.body.day,
          leaveFrom:leaveFrom,
          leaveTo:leaveTo,
      },
    });
    return res.status(200).json({
      updatedTraining,
      message:"Training day updated successfully."
    });
  } catch (error) {
    return res.status(400).json({ message:"Failed to update training day" });
  }
};
const deleteSingleTrining = async (req, res) => {
  try {
    const deletedTraing = await prisma.training.delete({
      where: {
        id: Number(req.params.id),
      },
    });
    return res.status(200).json({ 
      // deletedTraing,
      message:"Training day deleted successfully."
     });
  } catch (error) {
    return res.status(400).json({
      message:"Failed to delete training day"
    });
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
  createSingleTraining,
    getAllTrining,
    getSingleTrining,
    updateSingleTrining,
    deleteSingleTrining,
  };