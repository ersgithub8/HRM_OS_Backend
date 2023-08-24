const prisma = require("../../utils/prisma");
const sendEmail = require("../../utils/emails")
require("dotenv").config();
const crypto = require("crypto");

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

    if (!user) {
      console.log("User not found or password doesn't match");
      return res.status(400).json({ message: "Username or password is incorrect" });
    }
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
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const register = async (req, res) => {
  try {
    const join_date = new Date(req.body.joinDate);
    const leave_date = req.body.leaveDate ? new Date(req.body.leaveDate) : null;

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
        locationId: req.body.locationId?req.body.locationId:null,
        leavePolicyId: req.body.leavePolicyId,
        weeklyHolidayId: req.body.weeklyHolidayId,
        designationHistory: {
          create: {
            designationId: req.body.designationId,
            startDate: new Date(req.body.designationStartDate),
            endDate: req.body.designationEndDate ? new Date(req.body.designationEndDate) : null,
            comment: req.body.designationComment,
          },
        },
        salaryHistory: {
          create: {
            salary: req.body.salary,
            startDate: new Date(req.body.salaryStartDate),
            endDate: req.body.salaryEndDate ? new Date(req.body.salaryEndDate) : null,
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
          location: true,
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
          location: true,
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
          location: true,
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
      location: true,
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
          locationId: req.body.locationId,
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

const changepassword = async (req, res) => {
  try {
    const { oldpassword, newpassword,email } = req.body;

    if (!oldpassword || !newpassword) {
      return res.status(400).json({
        message: 'Please provide both old and new passwords.',
        error: true,
      });
    }
    const user = await prisma.user.findUnique({
      where: { email: email }, // Change here
    });

    if (!user) {
      return res.status(404).json({
        message: 'User Not Found.',
        error: true,
      });
    }

    const isPasswordMatch = await bcrypt.compare(oldpassword, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        message: 'Old password is incorrect.',
        error: true,
      });
    }

    const hashedPassword = await bcrypt.hash(newpassword, saltRounds);

    await prisma.user.update({
      where: { email: email }, // Change here
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      message: 'Password Changed Successfully',
      error: false,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Something went wrong',
      error: true,
    });
  }
};

const users_forgot_password = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetPasswordToken = crypto.randomBytes(3).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { email: email }, // Use email to identify the user
      data: {
        resetPasswordToken: resetPasswordToken,
        resetPasswordExpires: resetPasswordExpires,
      },
    });

    // Call your sendEmail function here
    await sendEmail("requestForgotPassword", {
      token: resetPasswordToken, // Use resetPasswordToken here
      email: req.body.email, // Use email from req.body here
      firstName: user.firstName,
      lastName: user.lastName,

    });

    return res.status(200).json({ message: 'Email sent with reset instructions', email: user.email });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

const users_otpmatch = async (req, res) => {
  try {
    const { email, resetPasswordToken, password } = req.body;

    // Check if the reset password token is still valid (expires in the future)
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        resetPasswordToken: resetPasswordToken,
        resetPasswordExpires: {
          gte: new Date(), // Ensure the field is a date type in your database
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Reset otp code is invalid or has expired",
        error: true,
      });
    }

    // Hash the new password
    // const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update the user's password and reset token/expiry
    await prisma.user.update({
      where: { email: email },
      data: {
        resetPasswordToken: resetPasswordToken,

      },
    });

    res.status(200).json({
      message: "Otp matched Successfully",
      error: false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong.",
    });
  }
};


const users_resetpassword = async (req, res) => {
  try {
    const { email,  password } = req.body;

    // Check if the reset password token is still valid (expires in the future)
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        resetPasswordExpires: {
          gte: new Date(), // Ensure the field is a date type in your database
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Password reset code is invalid or has expired",
        error: true,
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update the user's password and reset token/expiry
    await prisma.user.update({
      where: { email: email },
      data: {
        password: hashedPassword,
        resetPasswordToken:null,
        resetPasswordExpires:undefined

      },
    });

    res.status(200).json({
      message: "Password Reset Successful",
      error: false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong.",
    });
  }
};






module.exports = {
  login,
  register,
  getAllUser,
  getSingleUser,
  updateSingleUser,
  deleteSingleUser,
  users_forgot_password,
  users_otpmatch,
  changepassword,
  users_resetpassword
};
