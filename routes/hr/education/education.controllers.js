const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

const createSingleEducation = async (req, res) => {
  try {
    if (req.query.query === "deletemany") {
      const deletedEducation = await prisma.education.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });
      return res.status(200).json(deletedEducation);
    } else if (req.query.query === "createmany") {
      const createdEducation = await prisma.education.createMany({
        data: req.body.map((education) => {
          return {
            userId: education.userId,
            degree: education.degree,
            institution: education.institution,
            fieldOfStudy: education.fieldOfStudy,
            result: education.result,
            startDate: new Date(education.studyStartDate),
            endDate: new Date(education.studyEndDate),
          };
        }),
      });
      return res.status(201).json(createdEducation);
    } else {
      const createdEducation = await prisma.education.create({
        data: {
          userId: req.body.userId,
          degree: req.body.degree,
          institution: req.body.institution,
          fieldOfStudy: req.body.fieldOfStudy,
          result: req.body.result,
          startDate: new Date(req.body.studyStartDate),
          endDate: new Date(req.body.studyEndDate),
        },
      });
      return res.status(201).json(createdEducation);
    }
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

const getAllEducation = async (req, res) => {
  if (req.query.query === "all") {
    const allEducation = await prisma.education.findMany({
      orderBy: [
        {
          id: "asc",
        },
      ],
    });
    return res.status(200).json(allEducation);
  } else if (req.query.status === "false") {
    try {
      const { skip, limit } = getPagination(req.query);
      const allEducation = await prisma.education.findMany({
        where: {
          status: false,
        },
        orderBy: [
          {
            id: "asc",
          },
        ],
        skip: Number(skip),
        take: Number(limit),
      });
      return res.status(200).json(allEducation);
    } catch (error) {
      return res.status(400).json(error.message);
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allEducation = await prisma.education.findMany({
        orderBy: [
          {
            id: "asc",
          },
        ],
        where: {
          status: true,
        },
        skip: Number(skip),
        take: Number(limit),
      });
      return res.status(200).json(allEducation);
    } catch (error) {
      return res.status(400).json(error.message);
    }
  }
};

const getSingleEducation = async (req, res) => {
  try {
    const singleEducation = await prisma.education.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });

    if (
      (req.auth.sub !== singleEducation.userId &&
        !req.auth.permissions.includes("readAll-education")) ||
      !req.auth.permissions.includes("readSingle-education")
    ) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return res.status(200).json(singleEducation);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

const updateSingleEducation = async (req, res) => {
  try {
    if (req.query.query === "status") {
      const updatedEducation = await prisma.education.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          status: req.body.status,
        },
      });
      return res.status(200).json(updatedEducation);
    } else {
      const updatedEducation = await prisma.education.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          degree: req.body.degree,
          institution: req.body.institution,
          fieldOfStudy: req.body.fieldOfStudy,
          result: req.body.result,
          startDate: new Date(req.body.studyStartDate),
          endDate: new Date(req.body.studyEndDate),
        },
      });
      return res.status(200).json(updatedEducation);
    }
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

const deleteSingleEducation = async (req, res) => {
  try {
    const deletedEducation = await prisma.education.delete({
      where: {
        id: Number(req.params.id),
      },
    });
    return res.status(200).json(deletedEducation);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = {
  createSingleEducation,
  getAllEducation,
  getSingleEducation,
  updateSingleEducation,
  deleteSingleEducation,
};
