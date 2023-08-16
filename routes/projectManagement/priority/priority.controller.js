const prisma = require("../../../utils/prisma");
//create single priority controller
const createSinglePriority = async (req, res) => {
  if (req.query.query === "createmany") {
    try {
      const createdPriority = await prisma.priority.createMany({
        data: req.body,
        skipDuplicates: true,
      });
      return res.status(201).json(createdPriority);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    try {
      console.log(req.body);
      const createdPriority = await prisma.priority.create({
        data: {
          name: req.body.name,
        },
      });
      return res.status(201).json(createdPriority);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: error.message });
    }
  }
};

//get all priority controller
const getAllPriority = async (req, res) => {
  if (req.query.query === "all") {
    try {
      const allPriority = await prisma.priority.findMany();
      return res.status(200).json(allPriority);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

//get single priority controller
const getSinglePriority = async (req, res) => {
  try {
    const singlePriority = await prisma.priority.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });
    return res.status(200).json(singlePriority);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//update single priority controller
const updateSinglePriority = async (req, res) => {
  try {
    const updatedPriority = await prisma.priority.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name: req.body.name,
      },
    });
    return res.status(200).json(updatedPriority);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//delete single priority controller
const deleteSinglePriority = async (req, res) => {
  try {
    const deletedPriority = await prisma.priority.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });
    return res.status(200).json(deletedPriority);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createSinglePriority,
  getAllPriority,
  getSinglePriority,
  updateSinglePriority,
  deleteSinglePriority,
};
