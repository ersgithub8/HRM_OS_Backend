const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");
const moment = require('moment-timezone');

const createPublicHoliday = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many designation at once
      const deletedPublicHoliday = await prisma.publicHoliday.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });
      return res.status(200).json(deletedPublicHoliday);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
  else if (req.query.query === "createmany") {
    const createdPublicHoliday = await prisma.publicHoliday.createMany({
      data: req.body,
      skipDuplicates: true,
    });
    return res.status(201).json(createdPublicHoliday);
  }

  else {
    try {
      const { name, date: incomingDate } = req.body;
      const date = moment.tz(incomingDate, "Europe/London").toDate(); // Convert incoming date to London timezone

      // Check if a public holiday already exists for the specified date
      const existingPublicHoliday = await prisma.publicHoliday.findFirst({
        where: {
          date,
        },
      });

      if (existingPublicHoliday) {z
        return res.status(400).json({ message: 'A public holiday already exists for the specified date.' });
      }

      const createdPublicHoliday = await prisma.publicHoliday.create({
        data: {
          name,
          date,
        },
      });

      const allUsers = await prisma.user.findMany();
      const todayInLondon = moment().tz("Europe/London").startOf('day').toDate(); // Get today's date in London timezone

      for (const user of allUsers) {
        let updateData = {
          bankallowedleave: user.bankallowedleave ? (parseInt(user.bankallowedleave) + 1).toString() : '1', // Increment bankallowedleave by 1
        };

        // Only increment remaingbankallowedleave if the new holiday is after today
        if (date > todayInLondon && user.remaingbankallowedleave) {
          updateData.remaingbankallowedleave = (parseInt(user.remaingbankallowedleave) + 1).toString();
        }

        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }

      return res.status(201).json(createdPublicHoliday);
    }
    catch (error) {
      return res.status(400).json({ message: error.message });
    }

  }
};

const getAllPublicHoliday = async (req, res) => {
  if (req.query.query === "all") {
    const allPublicHoliday = await prisma.publicHoliday.findMany({
      orderBy: [
        {
          id: "desc",
        },
      ],
    });

    return res.status(200).json(allPublicHoliday);
  } else if (req.query.status === "false") {
    const { skip, limit } = getPagination(req.query);
    try {
      const allPublicHoliday = await prisma.publicHoliday.findMany({
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

      return res.status(200).json(allPublicHoliday);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allPublicHoliday = await prisma.publicHoliday.findMany({
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

      return res.status(200).json(allPublicHoliday);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getSinglePublicHoliday = async (req, res) => {
  try {
    const singlePublicHoliday = await prisma.publicHoliday.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });

    if (!singlePublicHoliday) {
      return res.status(404).json({ message: "public Holiday not found" });
    }

    return res.status(200).json(singlePublicHoliday);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateSinglePublicHoliday = async (req, res) => {
  try {
    const updatedPublicHoliday = await prisma.publicHoliday.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name: req.body.name,
        date: req.body.date,
      },
    });

    return res.status(200).json(updatedPublicHoliday);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteSinglePublicHoliday = async (req, res) => {
  try {
    const publicHoliday = await prisma.publicHoliday.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });

    if (!publicHoliday) {
      return res.status(404).json({ message: 'Public holiday not found.' });
    }

    // Check if the holiday is in the future
    const holidayDate = moment(publicHoliday.date).tz("Europe/London");
    const todayInLondon = moment().tz("Europe/London").startOf('day');

    const deletedPublicHoliday = await prisma.publicHoliday.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });

    const allUsers = await prisma.user.findMany();
    for (const user of allUsers) {
      let updateData = {};

      // Decrement bankallowedleave unconditionally because the holiday is being deleted
      if (user.bankallowedleave && parseInt(user.bankallowedleave) > 0) {
        const updatedBankAllowedLeaveCount = parseInt(user.bankallowedleave) - 1;
        updateData.bankallowedleave = updatedBankAllowedLeaveCount.toString();
      }

      // Only decrement remaingbankallowedleave if the deleted holiday is today or in the past
      if (holidayDate.isBefore(todayInLondon, 'day') && user.remaingbankallowedleave && parseInt(user.remaingbankallowedleave) > 0) {
        const updatedRemainingLeaveCount = parseInt(user.remaingbankallowedleave) - 1;
        updateData.remaingbankallowedleave = updatedRemainingLeaveCount.toString();
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    }

    return res.status(200).json(deletedPublicHoliday);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};


module.exports = {
  createPublicHoliday,
  getAllPublicHoliday,
  getSinglePublicHoliday,
  updateSinglePublicHoliday,
  deleteSinglePublicHoliday,
};
