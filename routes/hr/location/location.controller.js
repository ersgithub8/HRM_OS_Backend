const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

//create a new Location
const createSingleLocation = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many designation at once
      const deletelocation = await prisma.location.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });
      return res.status(200).json(deletelocation);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.query === "createmany") {
    try {
      // create many designation from an array of objects
      const createdLocation = await prisma.location.createMany({
        data: req.body,
        skipDuplicates: true,
      });
      return res.status(201).json(createdLocation);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    try {
      const createdLocation = await prisma.location.create({
        data: {
          locationName: req.body.locationName,
          latitude:req.body.latitude,
          longitude:req.body.longitude
        },
      });

      return res.status(201).json(createdLocation);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getAllLocation = async (req, res) => {
  if (req.query.query === "all") {
    const allLocation = await prisma.location.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userName: true,
            role: {
              select: {
                name: true,
                id: true,
              },
            },
            designationHistory: {
              orderBy: [
                {
                  id: "desc",
                },
              ],
              take: 1,

              select: {
                designation: {
                  select: {
                    name: true,
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        {
          id: "asc",
        },
      ],
    });
    return res.status(200).json(allLocation);
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allLocation = await prisma.location.findMany({
        orderBy: [
          {
            id: "asc",
          },
        ],
        skip: Number(skip),
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userName: true,
              role: {
                select: {
                  name: true,
                  id: true,
                },
              },
              designationHistory: {
                orderBy: [
                  {
                    id: "desc",
                  },
                ],
                take: 1,

                select: {
                  designation: {
                    select: {
                      name: true,
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      return res.status(200).json(allLocation);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getSingleLocation = async (req, res) => {
    try {
      const singleLocation = await prisma.location.findUnique({
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
              role: {
                select: {
                  name: true,
                  id: true,
                },
              },
              designationHistory: {
                orderBy: [
                  {
                    id: "desc",
                  },
                ],
                take: 1,
                select: {
                  designation: {
                    select: {
                      name: true,
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
  
  
      return res.status(200).json(singleLocation);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  };

const updateSingleLocation = async (req, res) => {
  try {
    const updatedLocation = await prisma.location.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        locationName: req.body.locationName,
          latitude:req.body.latitude,
          longitude:req.body.longitude
      },
    });
    return res.status(200).json(updatedLocation);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deletedLocation = async (req, res) => {
    try {
        const deletedLocation= await prisma.location.delete({
          where: {
            id: Number(req.params.id),
          },
        });
        return res.status(200).json({deletedLocation});
      } catch (error) {
        return res.status(400).json(error.message);
      }
};

module.exports = {
    createSingleLocation,
  getAllLocation,
  getSingleLocation,
  updateSingleLocation,
  deletedLocation,
};