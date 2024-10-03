const fs = require("fs");
const https = require("https");
const app = require("./data");
const moment = require("moment");
const winston = require("winston");

const PORT = process.env.PORT || 5000;

const prisma = require("./utils/prisma");
const cron = require("node-cron");

const updateUsersFields = async () => {
  try {
    // Fetch all users
    const allUsers = await prisma.user.findMany();

    for (const user of allUsers) {
      const updatedBankAllowedLeaveValue = "8"; // Convert to string
      const updatedAnnualAllowedLeaveValue = "20"; // Convert to string
      const remaingbankallowedleave = "8"; // Convert to string
      const remainingannualallowedleave = "20"; // Convert to string

      // Update the user fields
      await prisma.user.update({
        where: { id: user.id },
        data: {
          bankallowedleave: updatedBankAllowedLeaveValue,
          remaingbankallowedleave: remaingbankallowedleave,
          annualallowedleave: updatedAnnualAllowedLeaveValue,
          remainingannualallowedleave: remainingannualallowedleave,
        },
      });
    }

    console.log("User fields updated successfully.");
  } catch (error) {
    console.error("Error updating user fields:", error.message);
  }
};

// Schedule the cron job to run on August 31st (Month: 8, Day: 31)
cron.schedule("0 0 31 8 *", updateUsersFields);

// const createAttendanceOnLeave = async () => {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // Set today's time to midnight (only the date part)

//     console.log(today, "today (normalized)");

//     // Check if today is a public holiday
//     const isTodayPublicHoliday = await prisma.publicHoliday.findFirst({
//       where: {
//         date: {
//           gte: new Date(today), // Start of today
//           lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // End of today
//         },
//         status: true,
//       },
//     });

//     console.log(isTodayPublicHoliday, "isTodayPublicHoliday");

//     if (isTodayPublicHoliday) {
//       // Fetch all users
//       const users = await prisma.user.findMany();

//       // Check if all users have holiday attendance status
//       const usersOnHoliday = await prisma.attendance.findMany({
//         where: {
//           date: today,
//           attendenceStatus: "holiday",
//         },
//       });

//       if (usersOnHoliday.length === users.length) {
//         console.log(
//           "All users are already marked on holiday. Stopping cron job."
//         );
//         return; // Exit the function and stop further execution
//       }

//       // Process each user for attendance
//       for (const user of users) {
//         console.log(`Processing user: ${user.id}`);
//         const attendanceDate = today;

//         const attendance = await prisma.attendance.findFirst({
//           where: {
//             userId: user.id,
//             date: attendanceDate,
//           },
//         });

//         // Deduct leave from the user
//         const currentRemainingLeaves = parseFloat(user.remaingbankallowedleave);
//         const updatedRemainingLeaves = Math.max(currentRemainingLeaves - 1, 0);
//         await prisma.user.update({
//           where: {
//             id: user.id,
//           },
//           data: {
//             remaingbankallowedleave: updatedRemainingLeaves.toString(),
//           },
//         });

//         // If attendance is not already marked, mark it
//         if (!attendance) {
//           const attendancePromise = prisma.attendance.create({
//             data: {
//               userId: user.id,
//               inTime: null,
//               outTime: null,
//               punchBy: null,
//               inTimeStatus: null,
//               outTimeStatus: null,
//               comment: null,
//               date: attendanceDate,
//               attendenceStatus: "holiday",
//               ip: null,
//               totalHour: null,
//               createdAt: attendanceDate,
//             },
//           });
//           await attendancePromise;
//           console.log(
//             `Attendance marked for user ${user.id} on ${attendanceDate}`
//           );
//         }
//       }

//       console.log("Attendance marked for all users on the public holiday.");
//     } else {
//       console.log("Today is not a public holiday. No attendance marked.");
//     }
//   } catch (error) {
//     console.error("Error:", error.message);
//   }
// };

const createAttendanceOnLeave = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date

    console.log(today, "today (normalized)");

    // Fetch all public holidays before today (including past years)
    const previousPublicHolidays = await prisma.publicHoliday.findMany({
      where: {
        date: {
          lt: today, // Fetch holidays before today
        },
        status: true, // Only active holidays
      },
    });

    if (previousPublicHolidays.length === 0) {
      console.log("No previous holidays found.");
      return;
    }

    console.log(previousPublicHolidays, "Previous public holidays");

    // Fetch all users
    const users = await prisma.user.findMany();

    // Loop through each user
    for (const user of users) {
      console.log(`Processing user: ${user.id}`);

      // Fetch user's remaining leave once, before looping through holidays
      let currentRemainingLeaves = parseFloat(user.remaingbankallowedleave);

      // Track whether any holiday attendance was created
      let attendanceCreated = false;

      // Loop through each previous public holiday
      for (const holiday of previousPublicHolidays) {
        const holidayDate = new Date(holiday.date);
        holidayDate.setHours(0, 0, 0, 0); // Normalize the holiday date

        console.log(`Processing holiday: ${holiday.name} on ${holidayDate}`);

        // Check if the attendance has already been marked for the holiday
        const attendance = await prisma.attendance.findFirst({
          where: {
            userId: user.id,
            date: holidayDate,
          },
        });

        if (!attendance) {
          // If attendance is not marked, create it
          await prisma.attendance.create({
            data: {
              userId: user.id,
              inTime: null,
              outTime: null,
              punchBy: null,
              inTimeStatus: null,
              outTimeStatus: null,
              comment: `Marked holiday for ${holiday.name}`,
              date: holidayDate,
              attendenceStatus: "holiday",
              ip: null,
              totalHour: null,
              createdAt: holidayDate,
            },
          });

          console.log(
            `Attendance marked for user ${user.id} on holiday ${holidayDate}`
          );

          // Deduct 1 day of leave for the holiday (if leaves are available)
          if (currentRemainingLeaves > 0) {
            currentRemainingLeaves -= 1; // Deduct 1 leave for each holiday
            attendanceCreated = true; // Flag that attendance was created for this user
          } else {
            console.log(`User ${user.id} has no remaining leaves to deduct.`);
          }
        } else {
          console.log(
            `Attendance already exists for user ${user.id} on ${holidayDate}`
          );
        }
      }

      // If any attendance was created, update the user's remaining leave in the database
      if (attendanceCreated) {
        await prisma.user.update({
          where: { id: user.id },
          data: { remaingbankallowedleave: currentRemainingLeaves.toString() },
        });

        console.log(
          `Updated remaining leaves for user ${user.id}: ${currentRemainingLeaves}`
        );
      }
    }

    console.log(
      "Attendance marked and leave deducted for all users on all previous holidays."
    );
  } catch (error) {
    console.error("Error:", error.message);
  }
};

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      (info) => `${info.timestamp} [${info.level}]: ${info.message}`
    )
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

cron.schedule("*/1 * * * *", async () => {
  logger.info(`Cron job started .`);

  try {
    // Fetch all users along with their shifts and schedules
    const users = await prisma.user.findMany({
      include: {
        shifts: {
          include: {
            schedule: true,
          },
        },
      },
    });

    // Get the current time in Europe/London
    const nowLondon = moment().tz("Europe/London");
    logger.info(`Current London time: ${nowLondon.format()}`);

    for (const user of users) {
      // Find attendance where the user hasn't checked out yet
      const attendance = await prisma.attendance.findFirst({
        where: {
          userId: user.id,
          outTime: null, // User hasn't checked out yet
        },
      });

      if (attendance) {
        // Find today's schedule for the user
        const scheduleForToday = user.shifts
          .flatMap((shift) => shift.schedule)
          .find((schedule) => {
            const todayLondon = nowLondon.clone().startOf("day");
            const scheduleDateLondon = moment
              .utc(schedule.shiftDate)
              .tz("Europe/London")
              .startOf("day");
            return scheduleDateLondon.isSame(todayLondon, "day");
          });

        if (scheduleForToday) {
          if (scheduleForToday.endTime) {
            const endTimeUTC = moment.utc(scheduleForToday.endTime);
            const endTimeLondon = endTimeUTC.clone().tz("Europe/London");
            const endTimeWithBufferLondon = endTimeLondon
              .clone()
              .add(1, "minutes");
            logger.info(`Schedule endTime London: ${endTimeLondon.format()}`);
            logger.info(
              `EndTime with buffer London: ${endTimeWithBufferLondon.format()}`
            );
            if (nowLondon.isAfter(endTimeWithBufferLondon)) {
              const outTimeUTC = nowLondon.clone().utc().toDate();
              const inTimeUTC = moment.utc(attendance.inTime);

              // Calculate total hours
              const inTimeLondon = inTimeUTC.clone().tz("Europe/London");
              const totalMinutes = nowLondon.diff(inTimeLondon, "minutes");
              const hours = Math.floor(totalMinutes / 60);
              const minutes = totalMinutes % 60;
              const totalHour = parseFloat(
                `${hours}.${minutes < 10 ? "0" : ""}${minutes}`
              );

              // Automatically check out the user
              await prisma.attendance.update({
                where: {
                  id: attendance.id,
                },
                data: {
                  outTime: outTimeUTC,
                  totalHour: totalHour,
                  outTimeStatus: "Check out by system", // Mark as auto-checkout
                },
              });

              // Log the auto-checkout action
              console.log(
                `User ID ${user.id} auto-checked out at ${nowLondon.format()}`
              );
              logger.info(
                `User ID ${user.id} auto-checked out at ${nowLondon.format()}`
              );
            }
          } else {
            console.warn(
              `No endTime found for schedule ID ${scheduleForToday.id}`
            );
            logger.warn(
              `No endTime found for schedule ID ${scheduleForToday.id}`
            );
          }
        } else {
          console.warn(`No schedule found for user ID ${user.id} for today`);
          logger.warn(`No schedule found for user ID ${user.id} for today`);
        }
      }
    }
  } catch (error) {
    console.error("Error in auto-checkout cron job:", error.message);
    logger.error(`Error in auto-checkout cron job: ${error.message}`);
  }
});

cron.schedule(
  "* * * * * *",
  async () => {
    await createAttendanceOnLeave();
    console.log("Cron job ran at 12:01 AM.");
  },
  {
    scheduled: true,
    timezone: "Europe/London",
  }
);

// Schedule the cron job to run every day at 11:59 PM
cron.schedule("59 23 * * *", async () => {
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
            gte: today.startOf("day").toDate(),
            lte: today.endOf("day").toDate(),
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
            scheduleDate.setHours(0, 0, 0, 0) ===
              today
                .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                .toDate()
                .getTime() && schedule.status
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
            comment: "Absent",
            date: today.toDate(),
            attendenceStatus: "absent",
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
            comment: "Holiday",
            date: today.toDate(),
            attendenceStatus: "holiday",
            ip: null,
            totalHour: null,
            createdAt: today.toDate(),
          },
        });
      }
    }

    // Check if no active schedules were found for any user
    if (!anyActiveSchedule) {
      console.log("No active schedules found. No actions performed.");
    } else {
      console.log("Cron job executed successfully.");
    }
  } catch (error) {
    console.error("Error in cron job:", error.message);
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
