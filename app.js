const fs = require("fs");
const https = require("https");
const app = require("./data");
const moment = require("moment");
const winston = require('winston');

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
cron.schedule('0 0 31 8 *', updateUsersFields); // passed



//passed
const createAttendanceOnLeave = async () => {
  try {
    
    let currentTimeLondon = moment().tz("Europe/London");
    let todayLondon ;
    todayLondon = currentTimeLondon.format("YYYY-MM-DD");


    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set today's time to midnight (only the date part)

    // Check if today is a public holiday
    const isTodayPublicHoliday = await prisma.publicHoliday.findFirst({
      where: {
        date: {
          gte: new Date(today), // Start of today
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // End of today
        },
        status: true,
      },
    });

    //console.log(isTodayPublicHoliday, "isTodayPublicHoliday");

    if (isTodayPublicHoliday) {
      // Fetch all users
      const users = await prisma.user.findMany();

      // Check if all users have holiday attendance status
      const usersOnHoliday = await prisma.attendance.findMany({
        where: {
          date: todayLondon,
          //attendenceStatus: "holiday",
        },
      });
      console.log(usersOnHoliday, "isTodayPublicHoliday", todayLondon);

     
      if (usersOnHoliday.length === users.length) {
        console.log(
          "All users are already marked on holiday. Stopping cron job."
        );
        return; // Exit the function and stop further execution
      }

      // Process each user for attendance
      for (const user of users) {
        console.log(`Processing user: ${user.id}`);
        const attendanceDate = today;

        const attendance = await prisma.attendance.findFirst({
          where: {
            userId: user.id,
            date: attendanceDate,
          },
        });

        // Deduct leave from the user
        const currentRemainingLeaves = parseFloat(user.remaingbankallowedleave);
        const updatedRemainingLeaves = Math.max(currentRemainingLeaves - 1, 0);
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            remaingbankallowedleave: updatedRemainingLeaves.toString(),
          },
        });

        // If attendance is not already marked, mark it
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
              date: todayLondon,
              attendenceStatus: "holiday",
              ip: null,
              totalHour: null,
              createdAt: attendanceDate,
            },
          });
          await attendancePromise;
          console.log(
            `Attendance marked for user ${user.id} on ${attendanceDate}`
          );
        }
      }

      console.log("Attendance marked for all users on the public holiday.");
    } else {
      console.log("Today is not a public holiday. No attendance marked.");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
};

cron.schedule(
  "0 * * * * ",
  async () => {
    await createAttendanceOnLeave();
    console.log("Cron job ran at 12:01 AM.");
  },
  {
    scheduled: true,
    timezone: "Europe/London",
  }
);


const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`)
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ],
});

// This Cron Execute every 30 minutes and identify users whose shift time has exceeded by 30 minutes. This cron job
// is designed to automatically check out users who have checked in for their shift but forgot to check
// out after 30 minutes.

//passed
cron.schedule('0 * * * *', async () => {
  logger.info(`Cron job started.`);

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

    let todayLondon ;
    let currentLTimeAndDate;
    let currentLTime;
   

    currentTimeLondon = moment().tz("Europe/London");
    todayLondon = currentTimeLondon.format("YYYY-MM-DD");
    currentLTimeAndDate = currentTimeLondon.format("YYYY-MM-DD HH:mm:ss");
    currentLTime = currentTimeLondon.format("HH:mm:ss");
    let twoDaysBefore = currentTimeLondon.subtract(1, 'days').format("YYYY-MM-DD");

   

    for (const user of users) {
      // Find attendance where the user hasn't checked out yet
      const attendance = await prisma.attendance.findFirst({
        where: {
          userId: user.id,
          // outTime: null, // User hasn't checked out yet
          date : twoDaysBefore
        },
      });

      

      
        // Find today's schedule for the user
        
        let scheduleForToday = [];

      // Find today's schedule
        user.shifts.forEach((shift) => {
          shift.schedule.forEach((schedule) => {
            if (schedule.startTime !== null) {
              const scheduleDateLondon = schedule.shiftDate;
              
              if (scheduleDateLondon == twoDaysBefore) {
                scheduleForToday.push(schedule);
              }
            }
          });
        });
       

        if (scheduleForToday) {

          if (scheduleForToday[0]?.endTime ) {
            if(attendance) 
              {
                if(attendance.outTime == null)
                {
                  const attendanceupdate = await prisma.attendance.update({
                    where: {
                      id: attendance.id,
                    },
                    data: {
                      outTime: moment(scheduleForToday[0].endTime).format("HH:mm:ss"),
                      totalHour: String(scheduleForToday[0].workHour),
                      outTimeStatus: 'Check out by system', // Mark as auto-checkout
                    },
                  });
                }
                 
              }
              else
              {
                await prisma.attendance.create({
                  data: {
                    userId: user.id,
                    inTime: null,
                    outTime: null,
                    punchBy: 1, 
                    inTimeStatus: null,
                    outTimeStatus: "Attendence Marked by system",
                    comment: 'Absent',
                    date: twoDaysBefore,
                    attendenceStatus: 'absent',
                    ip: null,
                    totalHour: null,
                  },
                });  
              }
            
          } else {
             console.warn(`No endTime found for schedule ID ${scheduleForToday.id}`);
            // logger.warn(`No endTime found for schedule ID ${scheduleForToday.id}`);
          }
        } else {
          // console.warn(`No schedule found for user ID ${user.id} for today`);
          // logger.warn(`No schedule found for user ID ${user.id} for today`);
        }
      
    }
  } catch (error) {
   console.error('Error in auto-checkout cron job:', error.message);
    // logger.error(`Error in auto-checkout cron job: ${error.message}`);
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
