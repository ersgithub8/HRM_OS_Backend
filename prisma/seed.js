const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const saltRounds = 10;

const endpoints = [
  "rolePermission",
  "transaction",
  "permission",
  "dashboard",
  "user",
  "role",
  "designation",
  "account",
  "setting",
  "email",
  "attendance",
  "department",
  "education",
  "payroll",
  "leaveApplication",
  "shift",
  "employmentStatus",
  "announcement",
  "salaryHistory",
  "designationHistory",
  "award",
  "awardHistory",
  "file",
  "leavePolicy",
  "weeklyHoliday",
  "publicHoliday",
  "project",
  "milestone",
  "task",
  "projectTeam",
  "taskDependency",
  "taskStatus",
  "taskTime",
  "priority",
  "assignedTask",
];

const permissionTypes = ["create", "readAll", "readSingle", "update", "delete"];

// create permissions for each endpoint by combining permission type and endpoint name
const permissions = endpoints.reduce((acc, cur) => {
  const permission = permissionTypes.map((type) => {
    return `${type}-${cur}`;
  });
  return [...acc, ...permission];
}, []);

const roles = ["admin", "staff"];

const account = [
  { name: "Asset", type: "Asset" },
  { name: "Liability", type: "Liability" },
  { name: "Capital", type: "Owner's Equity" },
  { name: "Withdrawal", type: "Owner's Equity" },
  { name: "Revenue", type: "Owner's Equity" },
  { name: "Expense", type: "Owner's Equity" },
];

const subAccount = [
  { account_id: 1, name: "Cash" }, //1
  { account_id: 1, name: "Bank" }, //2
  { account_id: 1, name: "Inventory" }, //3
  { account_id: 1, name: "Accounts Receivable" }, //4
  { account_id: 2, name: "Accounts Payable" }, //5
  { account_id: 3, name: "Capital" }, //6
  { account_id: 4, name: "Withdrawal" }, //7
  { account_id: 5, name: "Sales" }, //8
  { account_id: 6, name: "Cost of Sales" }, //9
  { account_id: 6, name: "Salary" }, //10
  { account_id: 6, name: "Rent" }, //11
  { account_id: 6, name: "Utilities" }, //12
  { account_id: 5, name: "Discount Earned" }, //13
  { account_id: 6, name: "Discount Given" }, //14
];

const settings = {
  company_name: "My Company",
  address: "My Address",
  phone: "My Phone",
  email: "My Email",
  website: "My Website",
  footer: "My Footer",
  tag_line: "My Tag Line",
};

const department = [
  { name: "IT" },
  { name: "HR" },
  { name: "Sales" },
  { name: "Marketing" },
  { name: "Finance" },
  { name: "Operations" },
  { name: "Customer Support" },
];

const designation = [
  { name: "CEO" },
  { name: "CTO" },
  { name: "CFO" },
  { name: "COO" },
  { name: "HR Manager" },
];

const employmentStatus = [
  { name: "Intern", colourValue: "#00FF00", description: "Intern" },
  { name: "Permenent", colourValue: "#FF0000", description: "Permenent" },
  { name: "Staff", colourValue: "#FFFF00", description: "Staff" },
  { name: "Terminated", colourValue: "#00FFFF", description: "Terminated" },
];

const shifts = [
  {
    name: "Morning",
    startTime: "1970-01-01T08:00:00.000Z",
    endTime: "1970-01-01T16:00:00.000Z",
    workHour: 8,
  },
  {
    name: "Evening",
    startTime: "1970-01-01T16:00:00.000Z",
    endTime: "1970-01-01T00:00:00.000Z",
    workHour: 8,
  },
  {
    name: "Night",
    startTime: "1970-01-01T00:00:00.000Z",
    endTime: "1970-01-01T08:00:00.000Z",
    workHour: 8,
  },
];

const leavePolicy = [
  {
    name: "Policy 8-12",
    paidLeaveCount: 8,
    unpaidLeaveCount: 12,
  },
  {
    name: "Policy 12-15",
    paidLeaveCount: 12,
    unpaidLeaveCount: 15,
  },
  {
    name: "Policy 15-15",
    paidLeaveCount: 15,
    unpaidLeaveCount: 15,
  },
];

const weeklyHoliday = [
  {
    name: "Saturday-Thursday",
    startDay: "Saturday",
    endDay: "Thursday",
  },
  {
    name: "Sunday-Friday",
    startDay: "Sunday",
    endDay: "Friday",
  },
];

const date = new Date();

const publicHoliday = [
  {
    name: "New Year",
    date: date,
  },
  {
    name: "Independence Day",
    date: new Date(date.getTime() + 3 * 24 * 60 * 60 * 1000),
  },
  {
    name: "Christmas",
    date: new Date(date.getTime() + 9 * 24 * 60 * 60 * 1000),
  },
];

const award = [
  {
    name: "Employee of the Month",
    description: "Employee who has performed well in the month",
  },
  {
    name: "Employee of the Year",
    description: "Employee who has performed well in the year",
  },
];

const priority = [
  {
    name: "Low",
  },
  {
    name: "Medium",
  },
  {
    name: "High",
  },
];

async function main() {
  await prisma.department.createMany({
    data: department,
  });
  await prisma.designation.createMany({
    data: designation,
  });
  await prisma.employmentStatus.createMany({
    data: employmentStatus,
  });
  await prisma.shift.createMany({
    data: shifts,
  });

  await prisma.leavePolicy.createMany({
    data: leavePolicy,
  });

  await prisma.weeklyHoliday.createMany({
    data: weeklyHoliday,
  });

  await prisma.publicHoliday.createMany({
    data: publicHoliday,
  });

  await prisma.award.createMany({
    data: award,
  });

  await prisma.priority.createMany({
    data: priority,
  });

  await prisma.role.createMany({
    data: roles.map((role) => {
      return {
        name: role,
      };
    }),
  });
  await prisma.permission.createMany({
    data: permissions.map((permission) => {
      return {
        name: permission,
      };
    }),
  });
  for (let i = 1; i <= permissions.length; i++) {
    await prisma.rolePermission.create({
      data: {
        role: {
          connect: {
            id: 1,
          },
        },
        permission: {
          connect: {
            id: i,
          },
        },
      },
    });
  }
  const adminHash = await bcrypt.hash("admin", saltRounds);
  await prisma.user.create({
    data: {
      firstName: "omega",
      lastName: "solution",
      userName: "admin",
      password: adminHash,
      employmentStatusId: 1,
      departmentId: 1,
      roleId: 1,
      shiftId: 1,
      leavePolicyId: 1,
      weeklyHolidayId: 1,
    },
  });

  await prisma.account.createMany({
    data: account,
  });
  await prisma.subAccount.createMany({
    data: subAccount,
  });
  await prisma.appSetting.create({
    data: settings,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    process.exit(1);
  });
