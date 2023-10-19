const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");
const moment = require("moment");

const createShift = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many designation at once
      const deletedShift = await prisma.shift.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });

      return res.status(200).json(deletedShift);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.query === "createmany") {
    try {
      const createShift = await prisma.shift.createMany({
        data: req.body,
        skipDuplicates: true,
      });
      return res.status(201).json(createShift);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    try {
      // let workHour = moment(req.body.endTime).diff(
      //   moment(req.body.startTime),
      //   "hours"
      // );
      
      const timeDiff = moment(req.body.endTime).diff(moment(req.body.startTime));
      const totalMinutes = timeDiff / (1000 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const workHour = parseFloat(`${hours}.${(minutes < 10 ? '0' : '')}${minutes.toFixed(2)}`);
      let displayValue;
      if (workHour < 1) {
        // If workHour is less than 1, display the time in minutes
        displayValue = `${minutes} min`;
      } else {
        // If workHour is 1 or more, display the time in hours
        displayValue = `${workHour} hr`;
      }
      const createShift = await prisma.shift.create({
        data: {
          name: req.body.name,
          startTime: new Date(req.body.startTime),
          endTime: new Date(req.body.endTime),
          workHour: workHour,
        },
      });
      return res.status(201).json(createShift);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

// const getAllShift = async (req, res) => {
//   if (req.body.query === "all") {
//     try {
//       const getAllShift = await prisma.shift.findMany({
//         orderBy: {
//           id: "desc",
//         },
//       });

//       return res.status(200).json(getAllShift);
//     } catch (error) {
//       return res.status(400).json({ message: error.message });
//     }
//   } else {
//     const { skip, limit } = getPagination(req.query);
//     try {
//       // get all designation paginated
//       const allShift = await prisma.shift.findMany({
//         orderBy: {
//           id: "desc",
//         },
//         skip: parseInt(skip),
//         take: parseInt(limit),
//       });
//       return res.status(200).json(allShift);
//     } catch (error) {
//       return res.status(400).json({ message: error.message });
//     }
//   }
// };



const getAllShift = async (req, res) => {
  if (req.body.query === "all") {
    try {
      const getAllShift = await prisma.shift.findMany({
        orderBy: {
          id: "desc",
        },
      });

      // Modify each shift to display time in minutes or hours
      const modifiedShifts = getAllShift.map(shift => {
        const timeDiff = moment(shift.endTime).diff(moment(shift.startTime));
        const totalMinutes = timeDiff / (1000 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const workHour = parseFloat(`${hours}.${(minutes < 10 ? '0' : '')}${minutes.toFixed(2)}`);
        let displayValue;

        if (workHour < 1) {
          displayValue = `${minutes} min`;
        } else {
          displayValue = `${workHour} hr`;
        }

        return {
          ...shift,
          workHour: displayValue,
        };
      });

      return res.status(200).json(modifiedShifts);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      // Get all designation paginated
      const allShift = await prisma.shift.findMany({
        orderBy: {
          id: "desc",
        },
        skip: parseInt(skip),
        take: parseInt(limit),
      });

      // Modify each shift to display time in minutes or hours
      const modifiedShifts = allShift.map(shift => {
        const timeDiff = moment(shift.endTime).diff(moment(shift.startTime));
        const totalMinutes = timeDiff / (1000 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const workHour = parseFloat(`${hours}.${(minutes < 10 ? '0' : '')}${minutes.toFixed(2)}`);
        let displayValue;

        if (workHour < 1) {
          displayValue = `${minutes.toFixed(0)} min`;
        } else {
          displayValue = `${workHour} hr`;
        }

        return {
          ...shift,
          workHour: displayValue,
        };
      });

      return res.status(200).json(modifiedShifts);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getSingleShift = async (req, res) => {
  try {
    const singleShift = await prisma.shift.findUnique({
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
          },
        },
      },
    });

    return res.status(200).json(singleShift);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateSingleShift = async (req, res) => {
  try {
    const timeDiff = moment(req.body.endTime).diff(moment(req.body.startTime));
    const totalMinutes = timeDiff / (1000 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const workHour = parseFloat(`${hours}.${(minutes < 10 ? '0' : '')}${minutes.toFixed(2)}`);
    if (workHour < 0) {
      workHour = 24 + workHour;
    }
    const updateShift = await prisma.shift.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name: req.body.name,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
        workHour: workHour,
      },
    });

    return res.status(200).json(updateShift);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteSingleShift = async (req, res) => {
  try {
    const deleteShift = await prisma.shift.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });
    return res.status(200).json(deleteShift);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createShift,
  getAllShift,
  getSingleShift,
  updateSingleShift,
  deleteSingleShift,
};
