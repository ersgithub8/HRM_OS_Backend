const fs = require("fs");
const https = require("https");
const app = require("./app");

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
