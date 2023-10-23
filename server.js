const fs = require("fs");
const https = require("https");
const app = require("./app");
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

cron.schedule('1 0 * * *', async () => {
  await createAttendanceOnLeave();
  console.log('Cron job ran at 12:01 AM.');
}, {
  scheduled: true,
  timezone: 'America/New_York', 
});



// Optionally, you can stop the cron job after a specific duration
// Uncomment the following line if you want to stop the job after 10 minutes
// setTimeout(() => job.stop(), 10 * 60 * 1000);


// const updateUsersFields = async () => {
//   try {
//     // Fetch all users
//     const allUsers = await prisma.user.findMany();

//     for (const user of allUsers) {
//       const updatedBankAllowedLeaveValue = '8'; // Convert to string
//       const remaingbankallowedleave = '8'; // Convert to string

//       // Calculate years of service based on joining date
//       const joinDate = new Date(user.joinDate);
//       const currentDate = new Date();
//       const yearsOfService = Math.floor((currentDate - joinDate) / (365 * 24 * 60 * 60 * 1000));

//       // Calculate updated annual allowed leaves based on years of service
//       let updatedAnnualAllowedLeaveValue = '20'; // Default value

//       if (yearsOfService >= 5) {
//         updatedAnnualAllowedLeaveValue = (parseInt(updatedAnnualAllowedLeaveValue) + 1).toString();
//       }

//       if (yearsOfService >= 6) {
//         updatedAnnualAllowedLeaveValue = (parseInt(updatedAnnualAllowedLeaveValue) + 1).toString();
//       }

//       // Update the user fields
//       await prisma.user.update({
//         where: { id: user.id },
//         data: {
//           bankallowedleave: updatedBankAllowedLeaveValue,
//           remaingbankallowedleave: remaingbankallowedleave,  
//           annualallowedleave: updatedAnnualAllowedLeaveValue,
//           remainingannualallowedleave: updatedAnnualAllowedLeaveValue  
//         },
//       });
//     }

//     console.log('User fields updated successfully.');
//   } catch (error) {
//     console.error('Error updating user fields:', error.message);
//   }
// };

// run server depending on environment
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
