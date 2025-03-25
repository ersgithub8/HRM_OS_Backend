const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");
const admin = require("firebase-admin");
var FCM = require("fcm-node");
//create a new announement
const createSingleAnnouncement = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many designation at once
      const deletedAnnouncement = await prisma.employmentStatus.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });
      return res.status(200).json(deletedAnnouncement);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    try {
      // create single designation from an object
      const createdAnnouncement = await prisma.announcement.create({
        data: {
          title: req.body.title,
          description: req.body.description,
        },
      });

      const user = await prisma.user.findMany({ where: { status: true } });
      // console.log(user);
      const tokenArray = user.map((item) =>
        item.firebaseToken ? item.firebaseToken : null
      );
      const newTokens = tokenArray.filter((item) => item !== null);

      const Title = "Announcement:" + req.body.title;
      const Body = req.body.description;

      const Desc = "Announcement notification";
      // const Device = user.device;
      console.log(Title, Body, Desc, newTokens);
      sendNotify(Title, Body, Desc, newTokens);

      return res.status(201).json(createdAnnouncement);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};
//get all announement
const getAllAnnouncement = async (req, res) => {
  if (req.query.query === "all") {
    const allAnnouncement = await prisma.announcement.findMany({
      orderBy: [
        {
          id: "desc",
        },
      ],
    });
    return res.status(200).json(allAnnouncement);
  } else if (req.query.status === "false") {
    const { skip, limit } = getPagination(req.query);
    try {
      const allAnnouncement = await prisma.announcement.findMany({
        orderBy: [
          {
            id: "desc",
          },
        ],
        where: {
          status: false,
        },
        skip: Number(skip),
        take: Number(limit),
      });
      return res.status(200).json(allAnnouncement);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allAnnouncement = await prisma.announcement.findMany({
        orderBy: [
          {
            id: "desc",
          },
        ],
        where: {
          status: true,
        },
        skip: Number(skip),
        take: Number(limit),
      });
      return res.status(200).json(allAnnouncement);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};
//get single announement
const getSingleAnnouncement = async (req, res) => {
  try {
    const singleAnnouncement = await prisma.announcement.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });
    return res.status(200).json(singleAnnouncement);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
//update single announement
const updateSingleAnnouncement = async (req, res) => {
  try {
    const updatedAnnouncement = await prisma.announcement.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        title: req.body.title,
        description: req.body.description,
      },
    });
    return res.status(200).json(updatedAnnouncement);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
//delete single announement
const deletedAnnouncement = async (req, res) => {
  try {
    console.log("req.body", req.body);
    const deletedAnnouncement = await prisma.announcement.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        status: req.body.status,
      },
    });
    return res.status(200).json(deletedAnnouncement);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
//send notification to all user function
async function sendNotify(title, body, desc, tokens) {
  try {
    if (!Array.isArray(tokens)) {
      console.error("Error: tokens is not an array. Received:", tokens);
      tokens = tokens ? [tokens] : []; // Convert to array if it's a string, or make it an empty array
    }
    const messages = tokens.map((token) => ({
      data: {
        screen: "Announcements", // Specify the screen to navigate to
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
  createSingleAnnouncement,
  getAllAnnouncement,
  getSingleAnnouncement,
  updateSingleAnnouncement,
  deletedAnnouncement,
};
