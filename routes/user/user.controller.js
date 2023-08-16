const prisma = require("../../utils/prisma");
require("dotenv").config();

const bcrypt = require("bcrypt");
const saltRounds = 10;

const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

const login = async (req, res) => {
  try {
    const allUser = await prisma.user.findMany();
    const user = allUser.find(
      (u) =>
        u.userName === req.body.userName &&
        bcrypt.compareSync(req.body.password, u.password)
    );
    // get permission from user roles
    const permissions = await prisma.role.findUnique({
      where: {
        id: user.roleId,
      },
      include: {
        rolePermission: {
          include: {
            permission: true,
          },
        },
      },
    });
    // store all permissions name to an array
    const permissionNames = permissions.rolePermission.map(
      (rp) => rp.permission.name
    );

    if (user) {
      const token = jwt.sign(
        { sub: user.id, permissions: permissionNames },
        secret,
        {
          expiresIn: "24h",
        }
      );
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json({
        ...userWithoutPassword,
        token,
      });
    }
    return res
      .status(400)
      .json({ message: "userName or password is incorrect" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const register = async (req, res) => {
  try {
    const join_date = new Date(req.body.joinDate);
    const leave_date = new Date(req.body.leaveDate);

    const hash = await bcrypt.hash(req.body.password, saltRounds);
    const createUser = await prisma.user.create({
      data: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        userName: req.body.userName,
        password: hash,
        email: req.body.email,
        phone: req.body.phone,
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode,
        country: req.body.country,
        joinDate: join_date,
        leaveDate: leave_date,
        employeeId: req.body.employeeId,
        bloodGroup: req.body.bloodGroup,
        image: req.body.image,
        employmentStatusId: req.body.employmentStatusId,
        departmentId: req.body.departmentId,
        roleId: req.body.roleId,
        shiftId: req.body.shiftId,
        leavePolicyId: req.body.leavePolicyId,
        weeklyHolidayId: req.body.weeklyHolidayId,
        designationHistory: {
          create: {
            designationId: req.body.designationId,
            startDate: new Date(req.body.designationStartDate),
            endDate: new Date(req.body.designationEndDate),
            comment: req.body.designationComment,
          },
        },
        salaryHistory: {
          create: {
            salary: req.body.salary,
            startDate: new Date(req.body.salaryStartDate),
            endDate: new Date(req.body.salaryEndDate),
            comment: req.body.salaryComment,
          },
        },
        educations: {
          create: req.body.educations.map((e) => {
            return {
              degree: e.degree,
              institution: e.institution,
              fieldOfStudy: e.fieldOfStudy,
              result: e.result,
              startDate: new Date(e.studyStartDate),
              endDate: new Date(e.studyEndDate),
            };
          }),
        },
      },
    });
    const { password, ...userWithoutPassword } = createUser;
    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllUser = async (req, res) => {
  if (req.query.query === "all") {
    try {
      const allUser = await prisma.user.findMany({
        include: {
          designationHistory: {
            include: {
              designation: true,
            },
          },
          salaryHistory: true,
          educations: true,
          employmentStatus: true,
          department: true,
          role: true,
          shift: true,
          leavePolicy: true,
          weeklyHoliday: true,
          awardHistory: true,
        },
      });
      return res.status(200).json(
        allUser
          .map((u) => {
            const { password, ...userWithoutPassword } = u;
            return userWithoutPassword;
          })
          .sort((a, b) => a.id - b.id)
      );
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.status === "false") {
    try {
      const allUser = await prisma.user.findMany({
        where: {
          status: false,
        },
        include: {
          designationHistory: {
            include: {
              designation: true,
            },
          },
          salaryHistory: true,
          educations: true,
          employmentStatus: true,
          department: true,
          role: true,
          shift: true,
          leavePolicy: true,
          weeklyHoliday: true,
          awardHistory: true,
        },
      });
      return res.status(200).json(
        allUser
          .map((u) => {
            const { password, ...userWithoutPassword } = u;
            return userWithoutPassword;
          })
          .sort((a, b) => a.id - b.id)
      );
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else {
    try {
      const allUser = await prisma.user.findMany({
        where: {
          status: true,
        },
        include: {
          designationHistory: {
            include: {
              designation: true,
            },
          },
          salaryHistory: true,
          educations: true,
          employmentStatus: true,
          department: true,
          role: true,
          shift: true,
          leavePolicy: true,
          weeklyHoliday: true,
          awardHistory: true,
        },
      });
      return res.status(200).json(
        allUser
          .map((u) => {
            const { password, ...userWithoutPassword } = u;
            return userWithoutPassword;
          })
          .sort((a, b) => a.id - b.id)
      );
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

const getSingleUser = async (req, res) => {
  const singleUser = await prisma.user.findUnique({
    where: {
      id: Number(req.params.id),
    },
    include: {
      designationHistory: {
        include: {
          designation: true,
        },
      },
      salaryHistory: true,
      educations: true,
      employmentStatus: true,
      department: true,
      role: true,
      shift: true,
      leavePolicy: true,
      weeklyHoliday: true,
      awardHistory: {
        include: {
          award: true,
        },
      },
      leaveApplication: {
        orderBy: {
          id: "desc",
        },
        take: 5,
      },
      attendance: {
        orderBy: {
          id: "desc",
        },
        take: 1,
      },
    },
  });

  // calculate paid and unpaid leave days for the user for the current year
  const leaveDays = await prisma.leaveApplication.findMany({
    where: {
      userId: Number(req.params.id),
      status: "ACCEPTED",
      acceptLeaveFrom: {
        gte: new Date(new Date().getFullYear(), 0, 1),
      },
      acceptLeaveTo: {
        lte: new Date(new Date().getFullYear(), 11, 31),
      },
    },
  });
  const paidLeaveDays = leaveDays
    .filter((l) => l.leaveType === "PAID")
    .reduce((acc, item) => {
      return acc + item.leaveDuration;
    }, 0);
  const unpaidLeaveDays = leaveDays
    .filter((l) => l.leaveType === "UNPAID")
    .reduce((acc, item) => {
      return acc + item.leaveDuration;
    }, 0);

  singleUser.paidLeaveDays = paidLeaveDays;
  singleUser.unpaidLeaveDays = unpaidLeaveDays;
  singleUser.leftPaidLeaveDays =
    singleUser.leavePolicy.paidLeaveCount - paidLeaveDays;
  singleUser.leftUnpaidLeaveDays =
    singleUser.leavePolicy.unpaidLeaveCount - unpaidLeaveDays;
  const id = parseInt(req.params.id);
  // only allow admins and owner to access other user records. use truth table to understand the logic
  if (
    id !== req.auth.sub &&
    !req.auth.permissions.includes("readSingle-user")
  ) {
    return res
      .status(401)
      .json({ message: "Unauthorized. You are not an admin" });
  }

  if (!singleUser) return;
  const { password, ...userWithoutPassword } = singleUser;
  return res.status(200).json(userWithoutPassword);
};

const updateSingleUser = async (req, res) => {
  const id = parseInt(req.params.id);
  // only allow admins and owner to edit other user records. use truth table to understand the logic

  if (id !== req.auth.sub && !req.auth.permissions.includes("update-user")) {
    return res.status(401).json({
      message: "Unauthorized. You can only edit your own record.",
    });
  }
  try {
    // admin can change all fields
    if (req.auth.permissions.includes("update-user")) {
      const hash = await bcrypt.hash(req.body.password, saltRounds);
      const join_date = new Date(req.body.joinDate);
      const leave_date = new Date(req.body.leaveDate);
      const updateUser = await prisma.user.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          userName: req.body.userName,
          password: hash,
          email: req.body.email,
          phone: req.body.phone,
          street: req.body.street,
          city: req.body.city,
          state: req.body.state,
          zipCode: req.body.zipCode,
          country: req.body.country,
          joinDate: join_date,
          leaveDate: leave_date,
          employeeId: req.body.employeeId,
          bloodGroup: req.body.bloodGroup,
          image: req.body.image,
          employmentStatusId: req.body.employmentStatusId,
          departmentId: req.body.departmentId,
          roleId: req.body.roleId,
          shiftId: req.body.shiftId,
          leavePolicyId: req.body.leavePolicyId,
          weeklyHolidayId: req.body.weeklyHolidayId,
        },
      });
      const { password, ...userWithoutPassword } = updateUser;
      return res.status(200).json(userWithoutPassword);
    } else {
      // owner can change only password
      const hash = await bcrypt.hash(req.body.password, saltRounds);
      const updateUser = await prisma.user.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          password: hash,
        },
      });
      const { password, ...userWithoutPassword } = updateUser;
      return res.status(200).json(userWithoutPassword);
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
};

const deleteSingleUser = async (req, res) => {
  // const id = parseInt(req.params.id);
  // only allow admins to delete other user records
  if (!req.auth.permissions.includes("delete-user")) {
    return res
      .status(401)
      .json({ message: "Unauthorized. Only admin can delete." });
  }
  try {
    const deleteUser = await prisma.user.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        status: req.body.status,
      },
    });
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  login,
  register,
  getAllUser,
  getSingleUser,
  updateSingleUser,
  deleteSingleUser,
};
