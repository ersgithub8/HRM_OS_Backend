const prisma = require("../../utils/prisma");
const sendEmail = require("../../utils/emails");
require("dotenv").config();
const crypto = require("crypto");
const hirarchy = require("../hr/hirarchy/hirarchy.controller");
const moment = require("moment");
const bcrypt = require("bcryptjs");
const saltRounds = 10;
const _ = require("lodash");
const admin = require("firebase-admin");
var FCM = require("fcm-node");
const jwt = require("jsonwebtoken");
const { isNullOrUndefined } = require("util");
const secret = process.env.JWT_SECRET;

const login = async (req, res) => {
  try {
    const allUsers = await prisma.user.findMany();

    const user = allUsers.find((u) => u.email === req.body.email);
    if (!user) {
      return res
        .status(400)
        .json({ message: "Authentication failed. Email is incorrect." });
    }

    // if (user.applicationStatus === "PENDING") {
    //   return res.status(401).json({
    //     message: "Authentication failed. User account is not approved.",
    //   });
    // }
    // if (user.applicationStatus === "REJECTED") {
    //   return res.status(401).json({
    //     message: "Authentication failed. Your application has been rejected.",
    //   });
    // }

    const passwordMatches = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordMatches) {
      return res
        .status(400)
        .json({ message: "Authentication failed. Password is incorrect." });
    }

    // Update Firebase token and device information
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firebaseToken: req.body.firebaseToken || user.firebaseToken,
        device: req.body.device || "Android",
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;

    // get permission from user roles
    // const permissions = await prisma.role.findUnique({
    //   where: {
    //     id: user.roleId,
    //   },
    //   include: {
    //     rolePermission: {
    //       include: {
    //         permission: true,
    //       },
    //     },
    //   },
    // });

    // // store all permissions name to an array
    // const permissionNames = permissions.rolePermission.map(
    //   (rp) => rp.permission.name
    // );

    // const token = jwt.sign(
    //   { sub: user.id, permissions: permissionNames },
    //   secret,
    //   {
    //     expiresIn: "24h",
    //   }
    // );

    const token = jwt.sign(
      { sub: user.id },
      secret,
      {
        expiresIn: "24h",
      }
    );

    return res.status(200).json({
      ...userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(502)
      .json({ message: "Server is not responding. Please try again later." });
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
      message: "Validate successfully",
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

    // const existingUserByPhone = await prisma.user.findFirst({
    //   where: {
    //     phone: req.body.phone,
    //   },
    // });
    // const existingUserByuserName = await prisma.user.findFirst({
    //   where: {
    //     userName: req.body.userName,
    //   },
    // });
    // const existingUserByEmployeeId = await prisma.user.findFirst({
    //   where: {
    //     employeeId: req.body.employeeId,
    //   },
    // });

    if (existingUserByEmail) {
      return res.status(400).json({ message: "Email already exists." });
    }

    // if (existingUserByPhone) {
    //   return res.status(400).json({ message: "Phone number already exists." });
    // }
    // if (existingUserByuserName) {
    //   return res.status(400).json({ message: "UserName already exists." });
    // }
    // if (existingUserByEmployeeId) {
    //   return res.status(400).json({ message: "EmployeeId already exists." });
    // }
    const leavs = req.body.leavePolicyId
      ? await prisma.leavePolicy.findUnique({
        where: {
          id: req.body.leavePolicyId,
        },
      })
      : null;

    let remainingannualallowedleave;

    if (req.body.manualleave) {
      remainingannualallowedleave = req.body.manualleave.toString();
    } else if (!req.body.leavePolicyId && !req.body.manualleave) {
      remainingannualallowedleave = "";
    } else {
      remainingannualallowedleave = leavs
        ? leavs.paidLeaveCount.toString()
        : null;
    }
    const join_date = new Date();
    const leave_date = req.body.leaveDate ? req.body.leaveDate : null;
    const splitEmail = req.body.email?.split("@");
    const randomFourDigit = Math.floor(1000 + Math.random() * 9000);
    splitEmail[0] += randomFourDigit;
    let userID = splitEmail[0];
    let userNames = userID.replace(/[0-9]/g, "");
    const hash = await bcrypt.hash(req.body.password, saltRounds);
    const createUser = await prisma.user.create({
      data: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        userName: req.body.userName ? req.body.userName : userNames,
        firebaseToken: req.body.firebaseToken,
        password: hash,
        email: req.body.email,
        phone: req.body.phone,
        dob: req.body.dob,
        applicationStatus: req.body.applicationStatus,
        emergencycontact: req.body.emergencycontact,
        nicno: req.body.nicno,
        identitystatus: req.body.identitystatus,
        firstaid: req.body.firstaid,
        firstaidtext: req.body.firstaidtext,
        dbscheck: req.body.dbscheck,
        dbschecktext: req.body.dbschecktext,
        safeguarding: req.body.safeguarding,
        safeguardingtext: req.body.safeguardingtext,
        // manualleave:manualleave,
        designation: req.body.designation,
        address: req.body.address,
        companyname: req.body.companyname,
        emp_name: req.body.emp_name,
        emp_email: req.body.emp_email,
        emp_telno: req.body.emp_telno,
        joining_date: req.body.joining_date,
        end_date: req.body.end_date,

        reference_contact: req.body.reference_contact,
        referencecontacttwo: req.body.referencecontacttwo,
        companyname1: req.body.companyname1,
        designation1: req.body.designation1,
        joining_date1: req.body.joining_date1,
        end_date1: req.body.end_date1,
        address1: req.body.address1,
        emp_name1: req.body.emp_name1,
        emp_email1: req.body.emp_email1,
        emp_telno1: req.body.emp_telno1,
        street: req.body.street ? req.body.street : null,
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
        employmentStatusId: req.body.employmentStatusId
          ? req.body.employmentStatusId
          : null,
        departmentId: req.body.departmentId ? req.body.departmentId : null,
        roleId: req.body.roleId,
        //leaves section
        bankallowedleave: process.env.totalbankleaves,
        remaingbankallowedleave: process.env.totalremainbank,
        annualallowedleave: "",
        remainingannualallowedleave: remainingannualallowedleave,
        // reference_id: req.body.reference_id ? req.body.reference_id : null,
        shiftId: req.body.shiftId,
        locationId: req.body.locationId ? req.body.locationId : null,
        leavePolicyId: req.body.leavePolicyId ? req.body.leavePolicyId : null,
        weeklyHolidayId: req.body.weeklyHolidayId
          ? req.body.weeklyHolidayId
          : null,
        designationHistory: req.body.designationId
          ? {
            create: {
              designationId: req.body.designationId,
              startDate: new Date(),
              endDate: req.body.designationEndDate
                ? new Date(req.body.designationEndDate)
                : null,
              comment: req.body.designationComment,
            },
          }
          : {},
        salaryHistory: req.body.salary
          ? {
            create: {
              salary: req.body.salary,
              startDate: new Date(req.body.salaryStartDate),
              endDate: req.body.salaryEndDate
                ? new Date(req.body.salaryEndDate)
                : null,
              comment: req.body.salaryComment,
            },
          }
          : {},
        educations: req.body.educations
          ? {
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
          }
          : {},
      },
    });
    const { password, ...userWithoutPassword } = createUser;
    return res
      .status(200)
      .json({ userWithoutPassword, message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const getAllUser = async (req, res) => {
  try {
    const date = moment().startOf("day");

    const allUser = await prisma.user.findMany({
      include: {
        designationHistory: {
          include: {
            designation: true,
          },
          orderBy: {
            startDate: "desc", // Order by start date in ascending order
          },
        },
        salaryHistory: true,
        educations: true,
        location: true,
        employmentStatus: true,
        department: true,
        role: true,
        leavePolicy: true,
        weeklyHoliday: true,
        awardHistory: true,
        shifts: {
          select: {
            id: true,
            name: true,
            shiftFrom: true,
            shiftTo: true,
            weekNumber: true,
            status: true,
            location: true,
            createdAt: true,
            updatedAt: true,
            schedule: {
              where: {
                shiftDate: {
                  gte: date.format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
                  lt: moment(date)
                    .endOf("day")
                    .format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
                },
                status: true,
              },
              select: {
                day: true,
                shiftDate: true,
                workHour: true,
                room: {
                  select: {
                    id: true,
                    locationId: true,
                    userId: true,
                    roomName: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
                status: true,
              },
            },
          },
        },
        room: {
          orderBy: {
            id: "desc",
          },
          take: 1,
        },
      },
    });

    const formattedSchedule = allUser.map((user) => {
      const { password, shifts = [], ...userWithoutPassword } = user;

      const formattedShifts = shifts.map((shift) => {
        const formattedSchedule = (shift.schedule || []).map((s) => ({
          day: s.day,
          shiftDate: moment(s.shiftDate).format("MM/DD/YYYY"),
          workHour: s.workHour,
          room: {
            id: s.room.id,
            locationId: s.room.locationId,
            userId: s.room.userId,
            roomName: s.room.roomName,
            status: s.room.status,
            createdAt: s.room.createdAt,
            updatedAt: s.room.updatedAt,
          },
          status: s.status,
        }));

        return {
          ...shift,
          schedule: formattedSchedule,
        };
      });

      return {
        ...userWithoutPassword,
        shifts: formattedShifts,
      };
    });

    return res.status(200).json(formattedSchedule.sort((a, b) => b.id - a.id));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const getSingleUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    // if (
    //   userId !== req.auth.sub &&
    //   !req.auth.permissions.includes("readSingle-user")
    // ) {
    //   return res
    //     .status(401)
    //     .json({ message: "Unauthorized. You are not an admin" });
    // }

    // Fetch the user record by their ID
    console.log(userId, "trasjhk");

    const singleUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        designationHistory: {
          include: {
            designation: true,
          },
          orderBy: {
            startDate: "desc", // Order by start date in ascending order
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
        employmentStatus: true,
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
        shifts: {
          // Retrieve user's shifts with schedules
          select: {
            id: true,
            name: true,
            shiftFrom: true,
            shiftTo: true,
            weekNumber: true,
            status: true,
            location: true,
            createdAt: true,
            updatedAt: true,
            schedule: {
              select: {
                id: true,
                day: true,
                startTime: true,
                endTime: true,
                breakTime: true,
                folderTime: true,
                shiftDate: true,
                workHour: true,
                room: true,
                //  {
                //   select: {
                //     roomName: true,
                //   },
                // },
              },
            },
          },
        },

        room: {
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
        status: "APPROVED",
        acceptLeaveFrom: {
          gte: new Date(new Date().getFullYear(), 0, 1),
        },
        acceptLeaveTo: {
          lte: new Date(new Date().getFullYear(), 11, 31),
        },
      },
    });
    // Calculate remaining leave days
    const paidLeaveDays = leaveDays
      .filter((l) => l.leavecategory === "paid")
      .reduce((acc, item) => acc + item.leaveDuration, 0);

    const unpaidLeaveDays = leaveDays
      .filter((l) => l.leavecategory === "unpaid")
      .reduce((acc, item) => acc + item.leaveDuration, 0);

    // Set to null if leavePolicy or respective leave counts are null
    if (!singleUser.leavePolicy) {
      singleUser.leavePolicy = {
        id: null,
        name: null,
        paidLeaveCount: null,
        status: null,
        unpaidLeaveCount: null,
      };
      singleUser.paidLeaveDays = null;
      singleUser.unpaidLeaveDays = null;
      singleUser.leftPaidLeaveDays = null;
      singleUser.leftUnpaidLeaveDays = null;
    } else {
      const paidLeaveCount = singleUser.leavePolicy.paidLeaveCount;
      const unpaidLeaveCount = singleUser.leavePolicy.unpaidLeaveCount;

      singleUser.paidLeaveDays = paidLeaveDays;
      singleUser.unpaidLeaveDays = unpaidLeaveDays;
      singleUser.leftPaidLeaveDays = (
        paidLeaveCount - paidLeaveDays
      ).toString();
      singleUser.leftUnpaidLeaveDays = (
        unpaidLeaveCount - unpaidLeaveDays
      ).toString();

      // Ensure non-negative values
      singleUser.leftPaidLeaveDays = Math.max(0, singleUser.leftPaidLeaveDays);
      singleUser.leftUnpaidLeaveDays = Math.max(
        0,
        singleUser.leftUnpaidLeaveDays
      );
    }

    const roleId = singleUser.reference_id;

    if (roleId === null) {
      singleUser.superviser = null;
    } else {
      const superviser = await prisma.user.findUnique({
        where: {
          id: roleId,
        },
      });

      if (superviser) {
        const { password, ...userWithoutPassword } = superviser;
        singleUser.superviser = userWithoutPassword;
      } else {
        singleUser.superviser = null;
      }
    }

    const roleId2 = singleUser.referenceid_two;

    if (roleId2 === null) {
      singleUser.superviser2 = null;
    } else {
      const superviser2 = await prisma.user.findUnique({
        where: {
          id: roleId2, // Corrected roleId2 usage here
        },
      });

      if (superviser2) {
        const { password, ...userWithoutPassword } = superviser2;
        singleUser.superviser2 = userWithoutPassword; // Corrected superviser2 assignment here
      } else {
        singleUser.superviser2 = null;
      }
    }

    const { password, ...userWithoutPassword } = singleUser;

    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.log(error);
    return res
      .status(502)
      .json({ message: "Server is not responding. Please try again later." });
  }
};
const updateSingleUser = async (req, res) => {
  const id = parseInt(req.params.id);

  // if (id !== req.auth.sub && !req.auth.permissions.includes("update-user")) {
  //   return res.status(401).json({
  //     message: "Unauthorized. You can only edit your own record.",
  //   });
  // }

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        id: id,
      },
      include: {
        leavePolicy: true,
      },
    });
    if (req.body.employeeId) {
      const userWithEmployeeId = await prisma.user.findFirst({
        where: {
          employeeId: req.body.employeeId,
          NOT: {
            id: id, // Exclude the current user from the search
          },
        },
      });

      if (userWithEmployeeId) {
        return res.status(400).json({
          message: "Employee ID is already in use by another user.",
        });
      }
    }
    // console.log(existingUser);
    const leavs = req.body.leavePolicyId
      ? await prisma.leavePolicy.findUnique({
        where: {
          id: req.body.leavePolicyId,
        },
      })
      : null;
    let remainingannualallowedleave;

    if (req.body.manualleave) {
      remainingannualallowedleave = req.body.manualleave.toString();
    } else if (!req.body.leavePolicyId && !req.body.manualleave) {
      remainingannualallowedleave = "0";
    } else {
      remainingannualallowedleave = leavs
        ? leavs.paidLeaveCount.toString()
        : null;
    }
    let annualallowedleave;
    if (req.body.manualleave) {
      annualallowedleave = req.body.manualleave.toString();
    } else if (!req.body.leavePolicyId && !req.body.manualleave) {
      annualallowedleave = "0";
    } else {
      annualallowedleave = leavs ? leavs.paidLeaveCount.toString() : null;
    }

    // return
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
      image: req.body.image,
      country: req.body.country,
      departmentId: req.body.departmentId,
      roleId: req.body.roleId,
      reference_id: req.body.reference_id,
      referenceid_two: req.body.referenceid_two,
      shiftId: req.body.shiftId,
      locationId: req.body.locationId,
      leavePolicyId: req.body.leavePolicyId,
      weeklyHolidayId: req.body.weeklyHolidayId,
      remainingannualallowedleave: remainingannualallowedleave,
      annualallowedleave: annualallowedleave,
      contractAttachment: req.body.contractAttachment || null,
      firstaid: req.body.firstaid,
      dbscheck: req.body.dbscheck,
      dbschecktext: req.body.dbschecktext,
      contractAttachment: req.body.contractAttachment,
      safeguarding: req.body.safeguarding,
      designation: req.body.designation,
      address: req.body.address,
      companyname: req.body.companyname,
      emp_name: req.body.emp_name,
      emp_email: req.body.emp_email,
      emp_telno: req.body.emp_telno,
      joining_date: req.body.joining_date,
      end_date: req.body.end_date,
      companyname1: req.body.companyname1,
      designation1: req.body.designation1,
      joining_date1: req.body.joining_date1,
      end_date1: req.body.end_date1,
      address1: req.body.address1,
      emp_name1: req.body.emp_name1,
      emp_email1: req.body.emp_email1,
      emp_telno1: req.body.emp_telno1,
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
        emergencycontact:
          req.body.emergencycontact || existingUser.emergencycontact,
        nicno: req.body.nicno || existingUser.nicno,
        identitystatus: req.body.identitystatus || existingUser.identitystatus,
        firstaid: req.body.firstaid || existingUser.firstaid,
        firstaidtext: req.body.firstaidtext || existingUser.firstaidtext,
        dbscheck: req.body.dbscheck || existingUser.dbscheck,
        dbschecktext: req.body.dbschecktext || existingUser.dbschecktext,
        contractAttachment:
          req.body.contractAttachment || existingUser.contractAttachment,
        safeguarding: req.body.safeguarding || existingUser.safeguarding,
        safeguardingtext:
          req.body.safeguardingtext || existingUser.safeguardingtext,
        companyname: req.body.companyname || existingUser.companyname,
        designation: req.body.designation || existingUser.designation,
        joining_date: req.body.joining_date || existingUser.joining_date,
        end_date: req.body.end_date || existingUser.end_date,
        address: req.body.address || existingUser.address,
        reference_id: req.body.reference_id || existingUser.reference_id,
        referenceid_two:
          req.body.referenceid_two || existingUser.referenceid_two,
        dob: req.body.dob || existingUser.dob,
        reference_contact:
          req.body.reference_contact || existingUser.reference_contact,
        bankallowedleave:
          req.body.bankallowedleave || existingUser.bankallowedleave,
        remaingbankallowedleave:
          req.body.remaingbankallowedleave ||
          existingUser.remaingbankallowedleave,
        annualallowedleave: annualallowedleave,
        remainingannualallowedleave: remainingannualallowedleave,
        designation: req.body.designation || existingUser.designation,
        address: req.body.address || existingUser.address,
        companyname: req.body.companyname || existingUser.companyname,
        emp_name: req.body.emp_name || existingUser.emp_name,
        emp_email: req.body.emp_email || existingUser.emp_email,
        emp_telno: req.body.emp_telno || existingUser.emp_telno,
        joining_date: req.body.joining_date || existingUser.joining_date,
        end_date: req.body.end_date || existingUser.end_date,
        companyname1: req.body.companyname1 || existingUser.companyname1,
        designation1: req.body.designation1 || existingUser.designation1,
        joining_date1: req.body.joining_date1 || existingUser.joining_date1,
        end_date1: req.body.end_date1 || existingUser.end_date1,
        address1: req.body.address1 || existingUser.address1,
        emp_name1: req.body.emp_name1 || existingUser.emp_name1,
        emp_email1: req.body.emp_email1 || existingUser.emp_email,
        emp_telno1: req.body.emp_telno1 || existingUser.emp_telno1,
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

    if (existingUser.status && req.body.applicationStatus) {
      const Title = req.body.applicationStatus;
      const Body =
        existingUser.firstName +
        " " +
        existingUser.lastName +
        "  " +
        "Your application request has been " +
        req.body.applicationStatus;
      const Token = existingUser.firebaseToken;
      const Desc = "Application notification";
      sendnotifiy(Title, Body, Desc, Token);
    }

    return res.status(200).json({
      userWithoutPassword,
      message: "User  updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};
function sendnotifiy(Title, Body, Desc, Token) {
  try {
    const message = {
      notification: {
        title: Title,
        body: Body,
      },
      token: Token,
    };
    admin
      .messaging()
      .send(message)
      .then((response) => {
        console.log("Notification Send ....");
      })
      .catch((error) => {
        console.log("Error sending notification:", error);
      });
  } catch (error) {
    console.log("Error:", error);
  }
}

const updateSingleUserprofile = async (req, res) => {
  const id = parseInt(req.params.id);

  // if (id !== req.auth.sub && !req.auth.permissions.includes("update-user")) {
  //   return res.status(401).json({
  //     message: "Unauthorized. You can only edit your own record.",
  //   });
  // }

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
      street: req.body.street,
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
const updateSingleUserdocument = async (req, res) => {
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

    // Initialize an array to track the updated fields
    const updatedFields = [];

    let updateData = {
      image: req.body.image,
      firstaid: req.body.firstaid,
      dbscheck: req.body.dbscheck,
      safeguarding: req.body.safeguarding,
      contractAttachment: req.body.contractAttachment,
    };

    // Check each field for updates and add to the updatedFields array
    // Check each field for updates and add to the updatedFields array
    if (req.body.image !== undefined) updatedFields.push("Image");
    if (req.body.firstaid !== undefined)
      updatedFields.push("Firstaid document");
    if (req.body.dbscheck !== undefined) updatedFields.push("Dbs document");
    if (req.body.safeguarding !== undefined)
      updatedFields.push("Safeguarding document");
    if (req.body.contractAttachment !== undefined)
      updatedFields.push("ContractAttachment document");

    if (req.auth.permissions.includes("update-user")) {
      updateData = {
        ...updateData,
        userName: req.body.userName || existingUser.userName,
        phone: req.body.phone || existingUser.phone,
        zipCode: req.body.zipCode || existingUser.zipCode,
        joinDate: req.body.joinDate || existingUser.joinDate,
        leaveDate: req.body.leaveDate || existingUser.leaveDate,
      };

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

    // Construct the message based on the updatedFields array
    const message =
      updatedFields.length > 0
        ? `${updatedFields.join(", ")} deleted successfully`
        : "No fields deleted";

    return res.status(200).json({
      userWithoutPassword,
      message,
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
      message: "Phonenumber updated successfully",
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
};
const updateSingleStatus = async (req, res) => {
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
      status: req.body.status,
    };

    if (req.auth.permissions.includes("update-user")) {
      updateData = {
        ...updateData,
        status: req.body.status,
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
      message: "Phonenumber updated successfully",
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
};
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

const deletePermanentUser = async (req, res) => {
  const userId = parseInt(req.params.id);
  // Check if the user exists
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!userExists) {
    return res.status(404).json({ message: "User not found" });
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
        message: "Please provide both old and new passwords.",
        error: true,
      });
    }
    const user = await prisma.user.findUnique({
      where: { email: email }, // Change here
    });

    if (!user) {
      return res.status(404).json({
        message: "User Not Found.",
        error: true,
      });
    }

    const isPasswordMatch = await bcrypt.compare(oldpassword, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Old password is incorrect.",
        error: true,
      });
    }

    const hashedPassword = await bcrypt.hash(newpassword, saltRounds);

    await prisma.user.update({
      where: { email: email }, // Change here
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      message: "Password Changed Successfully",
      error: false,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong",
      error: true,
    });
  }
};

const users_forgot_password = async (req, res) => {
  try {
    // const { email } = req.body;
    if (req.body.email === "") {
      return res.status(404).json({
        message: "Email is required.",
        error: true,
      });
    }

    if (req.body.email) {
      let a = req.body.email.toLowerCase();
      req.body.email = a;
    }

    const user = await prisma.user.findUnique({
      where: { email: req.body.email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetPasswordToken = crypto.randomBytes(3).toString("hex");
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { email: req.body.email }, // Use email to identify the user
      data: {
        resetPasswordToken: resetPasswordToken,
        resetPasswordExpires: resetPasswordExpires,
      },
    });

    // Call your sendEmail function here
    let dd = await sendEmail("requestForgotPassword", {
      token: resetPasswordToken, // Use resetPasswordToken here
      email: req.body.email, // Use email from req.body here
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return res.status(200).json({
      message: "OTP code is send to your email",
      email: user.email,
      dd,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const users_otpmatch = async (req, res) => {
  try {
    const { resetPasswordToken, password } = req.body;
    if (req.body.email === "") {
      return res.status(404).json({
        message: "Email is required.",
        error: true,
      });
    }

    if (req.body.email) {
      let a = req.body.email.toLowerCase();
      req.body.email = a;
    }
    // Check if the reset password token is still valid (expires in the future)
    const user = await prisma.user.findFirst({
      where: {
        email: req.body.email,
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
      where: { email: req.body.email },
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
    const { password } = req.body;
    if (req.body.email === "") {
      return res.status(404).json({
        message: "Email is required.",
        error: true,
      });
    }

    if (req.body.email) {
      let a = req.body.email.toLowerCase();
      req.body.email = a;
    }

    // Check if the reset password token is still valid (expires in the future)
    const user = await prisma.user.findFirst({
      where: {
        email: req.body.email,
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
      where: { email: req.body.email },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: undefined,
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
function sendnotifiy(Title, Body, Desc, Token) {
  try {
    const message = {
      notification: {
        title: Title,
        body: Body,
      },
      token: Token,
    };
    admin
      .messaging()
      .send(message)
      .then((response) => {
        console.log("Notification Send ....");
      })
      .catch((error) => {
        console.log("Error sending notification:", error);
      });
  } catch (error) {
    console.log("Error:", error);
  }
}
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
  updateSingleStatus,
  updateSingleUserdocument,
  deletePermanentUser
};
