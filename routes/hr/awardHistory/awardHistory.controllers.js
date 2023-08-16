const prisma = require("../../../utils/prisma");

const createSingleAwardHistory = async (req, res) => {
  try {
    if (req.query.query === "deletemany") {
      const deletedAwardHistory = await prisma.awardHistory.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });
      res.json(deletedAwardHistory);
    } else {
      const createdAwardHistory = await prisma.awardHistory.create({
        data: {
          userId: req.body.userId,
          awardId: req.body.awardId,
          awardedDate: new Date(req.body.awardedDate),
          comment: req.body.comment,
        },
      });
      res.status(200).json(createdAwardHistory);
    }
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

const getAllAwardHistory = async (req, res) => {
  try {
    const allAwardHistory = await prisma.awardHistory.findMany({
      orderBy: [
        {
          id: "asc",
        },
      ],
    });
    res.json(allAwardHistory);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

const getSingleAwardHistory = async (req, res) => {
  try {
    const singleAwardHistory = await prisma.awardHistory.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });
    res.json(singleAwardHistory);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

const updateSingleAwardHistory = async (req, res) => {
  try {
    const updatedAwardHistory = await prisma.awardHistory.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        awardId: req.body.awardId,
        awardedDate: new Date(req.body.awardedDate),
        comment: req.body.comment,
      },
    });
    res.json(updatedAwardHistory);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

const deleteSingleAwardHistory = async (req, res) => {
  try {
    const deletedAwardHistory = await prisma.awardHistory.delete({
      where: {
        id: Number(req.params.id),
      },
    });
    res.status(200).json(deletedAwardHistory);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

module.exports = {
  createSingleAwardHistory,
  getAllAwardHistory,
  getSingleAwardHistory,
  updateSingleAwardHistory,
  deleteSingleAwardHistory,
};
