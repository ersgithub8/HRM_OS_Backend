const fs = require("fs");
const https = require("https");
const app = require("./data");
const moment = require("moment");

const PORT = process.env.PORT || 5000;

const prisma = require("./utils/prisma");
const cron = require('node-cron');

const updateUsersFields = async () => {
  try {
    // Fetch all users
    const allUsers = await prisma.user.findMany();

    for (const user of allUsers) {
      const updatedBankAllowedLeaveValue = '8'; // Convert to string
      const updatedAnnualAllowedLeaveValue = '20'; // Convert to string
      const remaingbankallowedleave = '8'; // Convert to string
      const remainingannualallowedleave = '20'; // Convert to string

      // Update the user fields
      await prisma.user.update({
        where: { id: user.id },
        data: {
          bankallowedleave: updatedBankAllowedLeaveValue,
          remaingbankallowedleave: remaingbankallowedleave,  
          annualallowedleave: updatedAnnualAllowedLeaveValue,
          remainingannualallowedleave: remainingannualallowedleave  
        },
      });
    }

    console.log('User fields updated successfully.');
  } catch (error) {
    console.error('Error updating user fields:', error.message);
  }
};

// Schedule the cron job to run on August 31st (Month: 8, Day: 31)
cron.schedule('0 0 31 8 *', updateUsersFields);

const createAttendanceOnLeave = async () => {
  try {
    const today = new Date();  
    const databaseRecordDate = new Date("2023-10-18T11:05:01.890Z");
    today.setHours(databaseRecordDate.getHours(), databaseRecordDate.getMinutes(), databaseRecordDate.getSeconds(), databaseRecordDate.getMilliseconds());
    
    console.log(today);
    const isTodayPublicHoliday = await prisma.publicHoliday.findFirst({
      where: {
        date: {
          equals: today,
        },
      },
    });
    if (isTodayPublicHoliday) {
      const users = await prisma.user.findMany();
      for (const user of users) {
        console.log(`Processing user: ${user.id}`);
        const attendanceDate = today; 
        const attendance = await prisma.attendance.findFirst({
          where: {
            userId: user.id,
            date: attendanceDate,
          },
        });
        const currentRemainingLeaves = parseFloat(user.remaingbankallowedleave);
        const updatedRemainingLeaves = Math.max(currentRemainingLeaves -1, 0);
        await prisma.user.update({
          where: {
            id: user.id, 
          },
          data: {
            remaingbankallowedleave: updatedRemainingLeaves.toString(),
          },
        });
        if (!attendance) {
          const attendancePromise = prisma.attendance.create({
            data: {
              userId: user.id,
              inTime: null,
              outTime: null,
              punchBy: null, 
              inTimeStatus: null,
              outTimeStatus: null,
              comment: null,
              date: attendanceDate,
              attendenceStatus: "holiday",
              ip: null,
              totalHour: null,
              createdAt: attendanceDate,
            },
          });
          await attendancePromise;
          console.log(`Attendance marked for user ${user.id} on ${attendanceDate}`);
        }
      }

      console.log("Attendance marked for all users on the public holiday");
    } else {
      console.log("Today is not a public holiday. No attendance marked.");
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// This Cron Execute every 30 minutes and identify users whose shift time has exceeded by 30 minutes. This cron job
// is designed to automatically check out users who have checked in for their shift but forgot to check
// out after 30 minutes.

cron.schedule('*/30 * * * *', async () => {
  console.log("cron run")
  try {
    const users = await prisma.user.findMany({
      include: {
        shifts: {
          include: {
            schedule: true,
          },
        },
      },
    });


    const now = moment();

    for (const user of users) {
      const attendance = await prisma.attendance.findFirst({
        where: {
          userId: user.id,
          outTime: null, // User hasn't checked out yet
        },
      });

      if (attendance) {
        // Find the schedule for today
        const scheduleForToday = user.shifts.flatMap(shift => shift.schedule).find(schedule => {
          return moment(schedule.shiftDate).isSame(now, 'day') && schedule.status;
        });

        if (scheduleForToday) {
          const endTime = moment(scheduleForToday.endTime).tz(user.timezone || 'UTC');

          // Check if 30 minutes have passed since the shift end time
          if (now.isAfter(endTime.add(30, 'minutes'))) {
            const outTime = now.toDate();
            const inTime = new Date(attendance.inTime);
            // Calculate total hours
            const totalMinutes = now.diff(moment(inTime), 'minutes');
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            const totalHour = parseFloat(`${hours}.${(minutes < 10 ? '0' : '')}${minutes}`);
            // Automatically check out the user
            await prisma.attendance.update({
              where: {
                id: attendance.id,
              },
              data: {
                outTime: outTime,
                totalHour: totalHour,  // Set the total hours
                outTimeStatus: 'OnTime', // Mark as auto-checkout
              },
            });

          }
        }
      }
    }
  } catch (error) {
    console.error('Error in auto-checkout cron job:', error.message);
  }
});


cron.schedule('59 23 * * *', async () => {
  await createAttendanceOnLeave();
  console.log('Cron job ran at 12:01 AM.');
}, {
  scheduled: true,
  timezone: 'America/New_York', 
});

// Schedule the cron job to run every day at 11:59 PM
cron.schedule('59 23 * * *', async () => {
  try {
    // Fetch all users
    const users = await prisma.user.findMany({
      include: {
        shifts: {
          include: {
            schedule: true,
          },
        },
      },
    });

    // Flag to track if any active schedule is found for any user
    let anyActiveSchedule = false;

    // Iterate through each user
    for (const user of users) {
      const today = moment();

      // Check if attendance is already marked for today
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          userId: user.id,
          date: {
            // Include time information in the comparison
            gte: today.startOf('day').toDate(),
            lte: today.endOf('day').toDate(),
          },
        },
      });

      if (existingAttendance) {
        // Attendance already marked for today, skip this user
        continue;
      }

      let scheduleForToday;

      // Iterate through all shifts and schedules to find the schedule for today
      for (const shift of user.shifts) {
        scheduleForToday = shift.schedule.find((schedule) => {
          const scheduleDate = new Date(schedule.shiftDate);
          return (
            scheduleDate.setHours(0, 0, 0, 0) === today.set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate().getTime() &&
            schedule.status
          );
        });

        if (scheduleForToday) {
          // Set the flag to true if an active schedule is found
          anyActiveSchedule = true;
          break; // Break the loop if a schedule for today is found
        }
      }

      if (scheduleForToday && scheduleForToday.status === true) {
        // Mark as absent
        await prisma.attendance.create({
          data: {
            userId: user.id,
            inTime: null,
            outTime: null,
            punchBy: 1, 
            inTimeStatus: null,
            outTimeStatus: null,
            comment: 'Absent',
            date: today.toDate(),
            attendenceStatus: 'absent',
            ip: null,
            totalHour: null,
            createdAt: today.toDate(),
          },
        });
      } else if (scheduleForToday && scheduleForToday.status === false) {
        // Mark as holiday
        await prisma.attendance.create({
          data: {
            userId: user.id,
            inTime: null,
            outTime: null,
            punchBy: 1, 
            inTimeStatus: null,
            outTimeStatus: null,
            comment: 'Holiday',
            date: today.toDate(),
            attendenceStatus: 'holiday',
            ip: null,
            totalHour: null,
            createdAt: today.toDate(),
          },
        });
      }
    }

    // Check if no active schedules were found for any user
    if (!anyActiveSchedule) {
      console.log('No active schedules found. No actions performed.');
    } else {
      console.log('Cron job executed successfully.');
    }
  } catch (error) {
    console.error('Error in cron job:', error.message);
  }
});

if (process.env.NODE_ENV === "production") {
  https
    .createServer(
      {
        key: fs.readFileSync("/etc/letsencrypt/live/lfix.us/privkey.pem"),
        cert: fs.readFileSync("/etc/letsencrypt/live/lfix.us/fullchain.pem"),
      },
      app
    )
    .listen(PORT, () => {
      console.log(`Server is running on production port ${PORT}`);
    });
} else {
  app.listen(PORT, () => {
    console.log(
      `Server is running in <${process.env.NODE_ENV}> on port <${PORT}>`
    );
  });
}
