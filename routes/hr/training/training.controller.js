const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");
const moment = require("moment");

const createSingleTraining = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many designation at once
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
      const createdTraining = await prisma.training.create({
        data: {
          day: req.body.day,
          leaveFrom: req.body.leaveFrom,
          leaveTo:req.body.leaveTo,
        },
      });

      return res.status(201).json({
        createdTraining,
        message:"Training added successfully"
      });
    } catch (error) {
      return res.status(400).json({ message: error.message });
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
      const allTraining = await prisma.location.findMany({
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
    return res.status(400).json({ message: error.message });
  }
};
const updateSingleTrining = async (req, res) => {
  try {
    const updatedTraining = await prisma.training.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        day: req.body.day,
          leaveFrom: req.body.leaveFrom,
          leaveTo:req.body.leaveTo,
      },
    });
    return res.status(200).json({
      updatedTraining,
      message:"Trainig updated successfully"
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
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
      deletedTraing,
      message:"Training deleted successfully"
     });
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = {
  createSingleTraining,
    getAllTrining,
    getSingleTrining,
    updateSingleTrining,
    deleteSingleTrining,
  };