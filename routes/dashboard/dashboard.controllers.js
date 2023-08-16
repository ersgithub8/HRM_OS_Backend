const prisma = require("../../utils/prisma");

const getDashboardData = async (req, res) => {
  try {
    // calculate total number of users
    const totalUsers = await prisma.user.count();
    // calculate total salary from all users
    const salaryByUser = await prisma.user.findMany({
      include: {
        salaryHistory: {
          orderBy: {
            id: "desc",
          },
        },
      },
    });
    const totalSalary = salaryByUser.reduce((acc, user) => {
      return acc + user.salaryHistory[0]?.salary;
    }, 0);
    // calculate today's attendance by unique users
    const today = new Date();
    const attendance = await prisma.attendance.findMany({
      where: {
        inTime: {
          gte: new Date(
            `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
          ),
          lte: new Date(
            `${today.getFullYear()}-${today.getMonth() + 1}-${
              today.getDate() + 1
            }`
          ),
        },
      },
    });
    // calculate total unique users from attendance
    const todayPresent = attendance.reduce((acc, user) => {
      if (!acc.includes(user.userId)) {
        acc.push(user.userId);
      }
      return acc;
    }, []).length;

    // calculate today on leave users from leaveApplication in between if today is between from and to
    const todayOnLeave = await prisma.leaveApplication.count({
      where: {
        AND: [
          {
            acceptLeaveFrom: {
              lte: new Date(
                `${today.getFullYear()}-${today.getMonth() + 1}-${
                  today.getDate() + 1
                }`
              ),
            },
          },
          {
            acceptLeaveTo: {
              gte: new Date(
                `${today.getFullYear()}-${
                  today.getMonth() + 1
                }-${today.getDate()}`
              ),
            },
          },
          {
            status: "ACCEPTED",
          },
        ],
      },
    });
    // today's absent
    const todayAbsent = totalUsers - todayPresent - todayOnLeave;
    // sum up daily total work hours from all users date wise and format it as above
    const workHours = await prisma.attendance.findMany({
      where: {
        inTime: {
          gte: new Date(req.query.startdate),
          lte: new Date(req.query.enddate),
        },
      },
    });
    // calculate totalHour for each day
    const workHoursDateWise = workHours.reduce((acc, user) => {
      const date = new Date(user.inTime).toISOString().split("T")[0];
      if (acc[date]) {
        acc[date] += user.totalHour;
      } else {
        acc[date] = user.totalHour;
      }
      return acc;
    }, {});
    // convert object to array and order by date
    const workHoursByDate = Object.keys(workHoursDateWise).map((date) => {
      return {
        type: "Work hours",
        date,
        // if null then 0
        time: parseFloat(workHoursDateWise[date]?.toFixed(2) || 0),
      };
    });
    workHoursByDate.sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });

    res.status(200).json({
      totalUsers,
      totalSalary,
      todayPresent,
      todayOnLeave,
      todayAbsent,
      workHoursByDate,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardData,
};
