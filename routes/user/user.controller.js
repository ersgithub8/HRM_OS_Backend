const prisma = require("../../utils/prisma");
const sendEmail = require("../../utils/emails")
require("dotenv").config();
const crypto = require("crypto");
const hirarchy=require("../hr/hirarchy/hirarchy.controller")

const bcrypt = require("bcrypt");
const saltRounds = 10;

const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

const login = async (req, res) => {
  try {
    const allUser = await prisma.user.findMany();
    const user = allUser.find(
      (u) =>
        u.userName === req.body.userName
    );


    if (!user) {
      console.log("User not found or password doesn't match");
      return res.status(400).json({ message: "Authentication failed.Username  is incorrect" });
    }
    if (!user.status) {
      console.log("User not found or password doesn't match");
      return res.status(400).json({ message: "Authentication failed.Username  is incorrect" });
    }
    const passwordMatches = bcrypt.compareSync(req.body.password, user.password);

    if (!passwordMatches) {
      console.log("Password doesn't match");
      return res.status(400).json({
        message: "Authentication failed. Password  is incorrect.",
      });
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

    return res.status(502).json({ message: "Server is not responding. Please try again later." });

  }
};

const validate = async (req, res) => {
  try {
    const existingUserByEmail = await prisma.user.findFirst({
      where: {
        email: req.body.email,
      },
    });

    const existingUserByPhone = await prisma.user.findFirst({
      where: {
        phone: req.body.phone,
      },
    });
    const existingUserByuserName = await prisma.user.findFirst({
      where: {
        userName: req.body.userName,
      },
    });
    // const existingUserByEmployeeId = await prisma.user.findFirst({
    //   where: {
    //     employeeId: req.body.employeeId,
    //   },
    // });

    if (existingUserByEmail) {
      return res.status(400).json({ message: "Email already exists." });
    }

    if (existingUserByPhone) {
      return res.status(400).json({ message: "Phone number already exists." });
    }
    if (existingUserByuserName) {
      return res.status(400).json({ message: "UserName already exists." });
    }
    // if (existingUserByEmployeeId) {
    //   return res.status(400).json({ message: "EmployeeId already exists." });
    // }
    return res.status(200).json({
      message:"Validate successfully"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const register = async (req, res) => {
  try {
    const existingUserByEmail = await prisma.user.findFirst({
      where: {
        email: req.body.email,
      },
    });

    const existingUserByPhone = await prisma.user.findFirst({
      where: {
        phone: req.body.phone,
      },
    });
    const existingUserByuserName = await prisma.user.findFirst({
      where: {
        userName: req.body.userName,
      },
    });
    // const existingUserByEmployeeId = await prisma.user.findFirst({
    //   where: {
    //     employeeId: req.body.employeeId,
    //   },
    // });

    if (existingUserByEmail) {
      return res.status(400).json({ message: "Email already exists." });
    }

    if (existingUserByPhone) {
      return res.status(400).json({ message: "Phone number already exists." });
    }
    if (existingUserByuserName) {
      return res.status(400).json({ message: "UserName already exists." });
    }
    // if (existingUserByEmployeeId) {
    //   return res.status(400).json({ message: "EmployeeId already exists." });
    // }
    const join_date = new Date();
    const leave_date = new Date();

    const hash = await bcrypt.hash(req.body.password, saltRounds);
    const createUser = await prisma.user.create({
      data: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        userName: req.body.userName,
        password: hash,
        email: req.body.email,
        phone: req.body.phone,
        dob: req.body.dob,
      
        emergencycontact:req.body.emergencycontact,
        nicno:req.body.nicno,
        identitystatus:req.body.identitystatus,
        firstaid:req.body.firstaid,
        firstaidtext:req.body.firstaidtext,
        dbscheck:req.body.dbscheck,
        dbschecktext:req.body.dbschecktext,
        safeguarding:req.body.safeguarding,
        safeguardingtext:req.body.safeguardingtext,



        companyname:req.body.companyname,
        designation:req.body.designation,
        joining_date:req.body.joining_date,
        end_date:req.body.end_date,
        address:req.body.address,
        reference_contact:req.body.reference_contact,
        street: req.body.street ? req.body.street:null,
        city: req.body.city ? req.body.city : null,
        state: req.body.state ? req.body.state : null,
        zipCode: req.body.zipCode ? req.body.zipCode : null,
        country: req.body.country ? req.body.country : null,
        joinDate: join_date,
        leaveDate: leave_date,
        employeeId: req.body.employeeId,
        bloodGroup: req.body.bloodGroup ? req.body.bloodGroup : null,
        image: req.body.image ? req.body.image : null,
        documents: req.body.documents ? req.body.documents : null,
        employmentStatusId: req.body.employmentStatusId ? req.body.employmentStatusId : null,
        departmentId: req.body.departmentId ? req.body.departmentId : null,
        roleId: req.body.roleId,
        // reference_id: req.body.reference_id ? req.body.reference_id : null,
        shiftId: req.body.shiftId,
        locationId: req.body.locationId ? req.body.locationId : null,
        leavePolicyId: req.body.leavePolicyId ? req.body.leavePolicyId : null,
        weeklyHolidayId: req.body.weeklyHolidayId ? req.body.weeklyHolidayId : null,
        designationHistory: req.body.designationId ? {
          create: {
            designationId: req.body.designationId,
            startDate: new Date(),
            endDate: req.body.designationEndDate ? new Date(req.body.designationEndDate) : null,
            comment: req.body.designationComment,
          },
        } : {},
        salaryHistory: req.body.salary ? {
          create: {
            salary: req.body.salary,
            startDate: new Date(req.body.salaryStartDate),
            endDate: req.body.salaryEndDate ? new Date(req.body.salaryEndDate) : null,
            comment: req.body.salaryComment,
          },
        } : {},
        educations: req.body.educations ? {
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
        } : {},
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
          .sort((a, b) => b.id - a.id)
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
          .sort((a, b) => b.id - a.id)
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
          .sort((a, b) => b.id - a.id)

      );
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};
// const getSingleUser = async (req, res) => {
//   try {
//     const singleUser = await prisma.user.findUnique({
//       where: {
//         id: Number(req.params.id),
//       },
//       include: {
//         designationHistory: {
//           include: {
//             designation: true,
//           },
//         },
//         salaryHistory: true,
//         educations: true,
//         location: true,
//         employmentStatus: true,
//         department: true,
//         role: true,
//         shift: true,
//         leavePolicy: true,
//         weeklyHoliday: true,
//         awardHistory: {
//           include: {
//             award: true,
//           },
//         },
//         leaveApplication: {
//           orderBy: {
//             id: "desc",
//           },
//           take: 5,
//         },
//         attendance: {
//           orderBy: {
//             id: "desc",
//           },
//           take: 1,
//         },
//       },
//     });

//     // calculate paid and unpaid leave days for the user for the current year
//     const leaveDays = await prisma.leaveApplication.findMany({
//       where: {
//         userId: Number(req.params.id),
//         status: "ACCEPTED",
//         acceptLeaveFrom: {
//           gte: new Date(new Date().getFullYear(), 0, 1),
//         },
//         acceptLeaveTo: {
//           lte: new Date(new Date().getFullYear(), 11, 31),
//         },
//       },
//     });
//     const paidLeaveDays = leaveDays
//       .filter((l) => l.leaveType === "PAID")
//       .reduce((acc, item) => {
//         return acc + item.leaveDuration;
//       }, 0);
//     const unpaidLeaveDays = leaveDays
//       .filter((l) => l.leaveType === "UNPAID")
//       .reduce((acc, item) => {
//         return acc + item.leaveDuration;
//       }, 0);

//     singleUser.paidLeaveDays = paidLeaveDays;
//     singleUser.unpaidLeaveDays = unpaidLeaveDays;
//     singleUser.leftPaidLeaveDays =
//       singleUser.leavePolicy.paidLeaveCount - paidLeaveDays;
//     singleUser.leftUnpaidLeaveDays =
//       singleUser.leavePolicy.unpaidLeaveCount - unpaidLeaveDays;
//     const id = parseInt(req.params.id);
//     // only allow admins and owner to access other user records. use truth table to understand the logic
//     if (
//       id !== req.auth.sub &&
//       !req.auth.permissions.includes("readSingle-user")
//     ) {
//       return res
//         .status(401)
//         .json({ message: "Unauthorized. You are not an admin" });
//     }

//     if (!singleUser) return;
//     const { password, ...userWithoutPassword } = singleUser;
//     return res.status(200).json(userWithoutPassword);
//   } catch (error) {
//     return res.status(502).json({ message: "Server is not responding. Please try again later." });
//   }
// };

const getSingleUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (
      userId !== req.auth.sub &&
      !req.auth.permissions.includes("readSingle-user")
    ) {
      return res.status(401).json({ message: "Unauthorized. You are not an admin" });
    }

    // Fetch the user record by their ID
    const singleUser = await prisma.user.findUnique({
      where: {
        id: userId,
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

    // Check if the user record exists
    if (!singleUser) {
      return res.status(404).json({ message: "User not found." });
    }
    const leaveDays = await prisma.leaveApplication.findMany({
      where: {
        userId: userId,
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
      .reduce((acc, item) => acc + item.leaveDuration, 0);

    const unpaidLeaveDays = leaveDays
      .filter((l) => l.leaveType === "UNPAID")
      .reduce((acc, item) => acc + item.leaveDuration, 0);

    // Calculate remaining leave days
    singleUser.paidLeaveDays = paidLeaveDays;
    singleUser.unpaidLeaveDays = unpaidLeaveDays;
    singleUser.leftPaidLeaveDays = singleUser.leavePolicy.paidLeaveCount - paidLeaveDays;
    singleUser.leftUnpaidLeaveDays = singleUser.leavePolicy.unpaidLeaveCount - unpaidLeaveDays;
    const roleId = singleUser.reference_id; 
    const superviser = await prisma.user.findUnique({
      where: {
        id: roleId,
      },
    });

    // Add the roleType to the user data
    singleUser.superviser = superviser;
    // Omit the password from the user data before sending the response
    const { password, ...userWithoutPassword } = singleUser;

    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    return res.status(502).json({ message: "Server is not responding. Please try again later." });
  }
};

// const updateSingleUser = async (req, res) => {
//   const id = parseInt(req.params.id);
//   // only allow admins and owner to edit other user records. use truth table to understand the logic

//   if (id !== req.auth.sub && !req.auth.permissions.includes("update-user")) {
//     return res.status(401).json({
//       message: "Unauthorized. You can only edit your own record.",
//     });
//   }
//   try {
//     // admin can change all fields
//     if (req.auth.permissions.includes("update-user")) {
//       const hash = await bcrypt.hash(req.body.password, saltRounds);
//       const join_date = new Date(req.body.joinDate);
//       const leave_date = new Date(req.body.leaveDate);
//       const updateUser = await prisma.user.update({
//         where: {
//           id: Number(req.params.id),
//         },
//         data: {
//           firstName: req.body.firstName,
//           lastName: req.body.lastName,
//           userName: req.body.userName,
//           password: hash,
//           email: req.body.email,
//           phone: req.body.phone,
//           street: req.body.street,
//           city: req.body.city,
//           state: req.body.state,
//           zipCode: req.body.zipCode,
//           country: req.body.country,
//           joinDate: join_date,
//           leaveDate: leave_date,
//           employeeId: req.body.employeeId,
//           bloodGroup: req.body.bloodGroup,
//           image: req.body.image,
//           employmentStatusId: req.body.employmentStatusId,
//           departmentId: req.body.departmentId,
//           roleId: req.body.roleId,
//           shiftId: req.body.shiftId,
//           locationId: req.body.locationId,
//           leavePolicyId: req.body.leavePolicyId,
//           weeklyHolidayId: req.body.weeklyHolidayId,
//         },
//       });
//       const { password, ...userWithoutPassword } = updateUser;
//       return res.status(200).json(userWithoutPassword);
//     } else {
//       // owner can change only password
//       const hash = await bcrypt.hash(req.body.password, saltRounds);
//       const updateUser = await prisma.user.update({
//         where: {
//           id: Number(req.params.id),
//         },
//         data: {
//           password: hash,
//         },
//       });
//       const { password, ...userWithoutPassword } = updateUser;
//       return res.status(200).json(userWithoutPassword);
//     }
//   } catch (error) {
//     console.log(error.message);
//     return res.status(500).json({ message: error.message });
//   }
// };


const updateSingleUser = async (req, res) => {
  const id = parseInt(req.params.id);

  if (id !== req.auth.sub && !req.auth.permissions.includes("update-user")) {
    return res.status(401).json({
      message: "Unauthorized. You can only edit your own record.",
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }
    let updateData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      documents: req.body.documents ? req.body.documents : null,
      applicationStatus: req.body.applicationStatus,
      zipCode: req.body.zipCode,
      country: req.body.country,
      departmentId: req.body.departmentId,
      roleId: req.body.roleId,
      reference_id:req.body.id,
      shiftId: req.body.shiftId,
      locationId: req.body.locationId,
      leavePolicyId: req.body.leavePolicyId,
      weeklyHolidayId: req.body.weeklyHolidayId,
    };

    if (req.auth.permissions.includes("update-user")) {
      updateData = {
        ...updateData,
        email: req.body.email || existingUser.email, // Use || operator instead of |
        image: req.body.image || existingUser.image,
        employeeId: req.body.employeeId || existingUser.employeeId,
        bloodGroup: req.body.bloodGroup || existingUser.bloodGroup,
        userName: req.body.userName || existingUser.userName,
        joinDate: req.body.joinDate || existingUser.joinDate,
        leaveDate: req.body.leaveDate || existingUser.leaveDate,
        employmentStatusId:
          req.body.employmentStatusId || existingUser.employmentStatusId,
        emergencycontact: req.body.emergencycontact || existingUser.emergencycontact,
        nicno: req.body.nicno || existingUser.nicno,
        identitystatus: req.body.identitystatus || existingUser.identitystatus,
        firstaid: req.body.firstaid || existingUser.firstaid,
        firstaidtext: req.body.firstaidtext || existingUser.firstaidtext,
        dbscheck: req.body.dbscheck || existingUser.dbscheck,
        dbschecktext: req.body.dbschecktext || existingUser.dbschecktext,
        safeguarding: req.body.safeguarding || existingUser.safeguarding,
        safeguardingtext: req.body.safeguardingtext || existingUser.safeguardingtext,
        companyname: req.body.companyname || existingUser.companyname,
        designation: req.body.designation || existingUser.designation,
        joining_date: req.body.joining_date || existingUser.joining_date,
        end_date: req.body.end_date || existingUser.end_date,
        address: req.body.address || existingUser.address,
        reference_id: req.body.reference_id || existingUser.reference_id,
        dob: req.body.dob || existingUser.dob,
        reference_contact:req.body.reference_contact || existingUser.reference_contact,
        bankallowedleave:req.body.bankallowedleave || existingUser.bankallowedleave,
        remaingbankallowedleave:req.body.remaingbankallowedleave || existingUser.remaingbankallowedleave,
        annualallowedleave:req.body.annualallowedleave || existingUser.annualallowedleave,
        remainingannualallowedleave:req.body.remainingannualallowedleave || existingUser.remainingannualallowedleave,


      };
    } else {
      // owner can change only password
      updateData.password = req.body.password;
    }

    const updateUser = await prisma.user.update({
      where: {
        id: Number(req.params.id),
      },
      data: updateData,
    });

    const { password, ...userWithoutPassword } = updateUser;
    return res.status(200).json({
      userWithoutPassword,
      message: "User profile updated successfully",
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
};

const updateSingleUserprofile = async (req, res) => {
  const id = parseInt(req.params.id);

  if (id !== req.auth.sub && !req.auth.permissions.includes("update-user")) {
    return res.status(401).json({
      message: "Unauthorized. You can only edit your own record.",
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }
    let updateData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      street: req.body.street
    };

    if (req.auth.permissions.includes("update-user")) {
      updateData = {
        ...updateData,
        image: req.body.image || existingUser.image,
        userName: req.body.userName || existingUser.userName,
        phone: req.body.phone || existingUser.phone,
        zipCode: req.body.zipCode || existingUser.zipCode,
        joinDate: req.body.joinDate || existingUser.joinDate,
        leaveDate: req.body.leaveDate || existingUser.leaveDate,
      };
    }
    else {
      // owner can change only password
      updateData.password = req.body.password;
    }

    const updateUser = await prisma.user.update({
      where: {
        id: Number(req.params.id),
      },
      data: updateData,
    });

    const { password, ...userWithoutPassword } = updateUser;
    return res.status(200).json({
      userWithoutPassword,
      message: "User profile updated successfully"
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
};

const updateSingleUserphone = async (req, res) => {
  const id = parseInt(req.params.id);

  if (id !== req.auth.sub && !req.auth.permissions.includes("update-user")) {
    return res.status(401).json({
      message: "Unauthorized. You can only edit your own record.",
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }
    let updateData = {
      phone: req.body.phone,
    };

    if (req.auth.permissions.includes("update-user")) {
      updateData = {
        ...updateData,
        firstName: req.body.firstName || existingUser.firstName,
        lastName: req.body.lastName || existingUser.lastName,
        email: req.body.email || existingUser.email,
        city: req.body.city || existingUser.city,
        state: req.body.state || existingUser.state,
        country: req.body.country || existingUser.country,
        image: req.body.image || existingUser.image,
        userName: req.body.userName || existingUser.userName,
        street: req.body.street || existingUser.street,
        zipCode: req.body.zipCode || existingUser.zipCode,
        // Validating and parsing joinDate and leaveDate
        joinDate: req.body.joinDate || existingUser.joinDate,
        leaveDate: req.body.leaveDate || existingUser.leaveDate,
        // Rest of the fields...
      };
    } else {
      // owner can change only password
      updateData.password = req.body.password;
    }

    const updateUser = await prisma.user.update({
      where: {
        id: Number(req.params.id),
      },
      data: updateData,
    });

    const { password, ...userWithoutPassword } = updateUser;
    return res.status(200).json({
      userWithoutPassword,
      message: "Phonenumber updated successfully"
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
};


// const deleteSingleUser = async (req, res) => {
//   const id = parseInt(req.params.id);
//   // only allow admins to delete other user records
//   if (!req.auth.permissions.includes("delete-user")) {
//     return res
//       .status(401)
//       .json({ message: "Unauthorized. Only admin can delete." });
//   }
//   try {
//     const deleteUser = await prisma.user.update({
//       where: {
//         id: Number(req.params.id),
//       },
//       data: {
//         status: req.body.status,
//       },
//     });
//     return res.status(200).json({ message: "User deleted successfully" });
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// };
const deleteSingleUser = async (req, res) => {
  const userId = parseInt(req.params.id);
  // Check if the user exists
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!userExists) {
    return res.status(404).json({ message: "User not found" });
  }

  // Check if the requesting user has permission to delete
  if (!req.auth.permissions.includes("delete-user")) {
    return res
      .status(401)
      .json({ message: "Unauthorized. Only admin can delete." });
  }

  try {
    // Delete related data from foreign tables
    await prisma.attendance.deleteMany({
      where: { userId: userId },
    });

    await prisma.leaveApplication.deleteMany({
      where: { userId: userId },
    });
    await prisma.salaryHistory.deleteMany({
      where: {
        userId: userId,
      },
    });
    await prisma.designationHistory.deleteMany({
      where: {
        userId: userId,
      },
    });

    await prisma.payslip.deleteMany({
      where: { userId: userId },
    });

    await prisma.education.deleteMany({
      where: { userId: userId },
    });
    await prisma.awardHistory.deleteMany({
      where: { userId: userId },
    });
    // await prisma.leavePolicy.deleteMany({
    //   where: { userId: userId },
    // });
    // await prisma.weeklyHoliday.deleteMany({
    //   where: { userId: userId },
    // });
    await prisma.project.deleteMany({
      where: { projectManagerId: userId },
    });
    await prisma.projectTeamMember.deleteMany({
      where: { userId: userId },
    });
    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


const changepassword = async (req, res) => {
  try {
    const { oldpassword, newpassword, email } = req.body;

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
    const { email, password } = req.body;

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
        resetPasswordToken: null,
        resetPasswordExpires: undefined

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
  users_resetpassword,
  updateSingleUserprofile,
  updateSingleUserphone,
  validate,
};
