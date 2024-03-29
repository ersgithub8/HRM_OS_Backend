const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

const createSingleRole = async (req, res) => {
  try {
    if (req.query.query === "deletemany") {
      const deletedRole = await prisma.role.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });
      res.json(deletedRole);
    } else if (req.query.query === "createmany") {
      console.log(
        req.body.map((role) => {
          return {
            name: role.name,
          };
        })
      );
      console.log(req.body);
      const createdRole = await prisma.role.createMany({
        data: req.body,
        skipDuplicates: true,
      });
      res.status(200).json(createdRole);
    } else {
      const createdRole = await prisma.role.create({
        data: {
          name: req.body.name,
        },
      });
      res.status(200).json(createdRole);
    }
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

const getAllRole = async (req, res) => {
  if (req.query.query === "all") {
    const allRole = await prisma.role.findMany({
      orderBy: [
        {
          id: "desc",
        },
      ],
    });
    res.json(allRole);
  } else if (req.query.status === "false") {
    try {
      const { skip, limit } = getPagination(req.query);
      const allRole = await prisma.role.findMany({
        where: {
          status: false,
        },
        orderBy: [
          {
            id: "desc",
          },
        ],
        skip: Number(skip),
        take: Number(limit),
      });
      res.json(allRole);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allRole = await prisma.role.findMany({
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
      res.json(allRole);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  }
};

const getSingleRole = async (req, res) => {
  try {
    const singleRole = await prisma.role.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        rolePermission: {
          include: {
            permission: true,
          },
        },
      },
    });
    res.json(singleRole);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

const updateSingleRole = async (req, res) => {
  try {
    const updatedRole = await prisma.role.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        name: req.body.name,
      },
    });
    res.json(updatedRole);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};
const deleteSingleRole = async (req, res) => {
  const roleId = parseInt(req.params.id);

  try {
    const userCountWithRole = await prisma.user.count({
      where: {
        roleId: roleId,
      },
    });

    if (userCountWithRole > 0) {
      return res.status(400).json({
        message: `This roll are assigned  ${userCountWithRole} users.`,
      });
    }


    // If no users are using the role, you can proceed with deletion
    const deletedRole = await prisma.role.delete({
      where: {
        id: roleId,
      },
    });

    if (!deletedRole) {
      return res.status(404).json({ message: "Role delete failed" });
    }

    return res.status(200).json(deletedRole);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



module.exports = {
  createSingleRole,
  getAllRole,
  getSingleRole,
  updateSingleRole,
  deleteSingleRole,
};
