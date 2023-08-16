const prisma = require("../../../utils/prisma");

const createSingleDesignationHistory = async (req, res) => {
  try {
    if (req.query.query === "deletemany") {
      const deletedDesignationHistory =
        await prisma.designationHistory.deleteMany({
          where: {
            id: {
              in: req.body,
            },
          },
        });
      return res.status(200).json(deletedDesignationHistory);
    } else if (req.query.query === "createmany") {
      const createdDesignationHistory =
        await prisma.designationHistory.createMany({
          data: req.body,
          skipDuplicates: true,
        });
      return res.status(201).json(createdDesignationHistory);
    } else {
      const createdDesignationHistory = await prisma.designationHistory.create({
        data: {
          userId: req.body.userId,
          designationId: req.body.designationId,
          startDate: new Date(req.body.designationStartDate),
          endDate: new Date(req.body.designationEndDate),
          comment: req.body.designationComment,
        },
      });
      return res.status(201).json(createdDesignationHistory);
    }
  } catch (error) {
    return res.status(200).json(error.message);
  }
};

const getAllDesignationHistory = async (req, res) => {
  try {
    const allDesignationHistory = await prisma.designationHistory.findMany({
      orderBy: [
        {
          id: "asc",
        },
      ],
    });
    return res.status(200).json(allDesignationHistory);
  } catch (error) {
    return res.status(200).json(error.message);
  }
};

const getSingleDesignationHistory = async (req, res) => {
  try {
    const singleDesignationHistory = await prisma.designationHistory.findUnique(
      {
        where: {
          id: Number(req.params.id),
        },
      }
    );
    return res.status(200).json(singleDesignationHistory);
  } catch (error) {
    return res.status(200).json(error.message);
  }
};

const updateSingleDesignationHistory = async (req, res) => {
  try {
    const updatedDesignationHistory = await prisma.designationHistory.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        designationId: req.body.designationId,
        startDate: new Date(req.body.designationStartDate),
        endDate: new Date(req.body.designationEndDate),
        comment: req.body.designationComment,
      },
    });
    return res.status(200).json(updatedDesignationHistory);
  } catch (error) {
    return res.status(200).json(error.message);
  }
};

const deleteSingleDesignationHistory = async (req, res) => {
  try {
    const deletedDesignationHistory = await prisma.designationHistory.delete({
      where: {
        id: Number(req.params.id),
      },
    });
    return res.status(200).json(deletedDesignationHistory);
  } catch (error) {
    return res.status(200).json(error.message);
  }
};

module.exports = {
  createSingleDesignationHistory,
  getAllDesignationHistory,
  getSingleDesignationHistory,
  updateSingleDesignationHistory,
  deleteSingleDesignationHistory,
};
