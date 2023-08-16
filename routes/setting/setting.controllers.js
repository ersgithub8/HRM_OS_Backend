const prisma = require("../../utils/prisma");

const updateSetting = async (req, res) => {
  try {
    const updatedSetting = await prisma.appSetting.update({
      where: {
        id: 1,
      },
      data: { ...req.body },
    });
    return res.status(200).json(updatedSetting);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

const getSetting = async (req, res) => {
  try {
    const newSetting = await prisma.appSetting.findUnique({
      where: {
        id: 1,
      },
    });
    return res.status(201).json(newSetting);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = {
  updateSetting,
  getSetting,
};
