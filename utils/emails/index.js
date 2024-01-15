const nodemailer = require("nodemailer");
const ejs = require("ejs");
const rootPath = require("../rootPath");
const path = require("path");

//for hosting email
var transporter = nodemailer.createTransport({
  host: "backend.wise1ne.com",
  port: 465,
  secure: true,
  auth: {
    user: "wmbchildcare@backend.wise1ne.com",
    pass: "Alliswell11@",
  },
  tls: {
    rejectUnauthorized: false,
  },
});



// console.log(process.env.user);
const createEmailOption = ({ receipentEmail, subject, body, html }) => ({
  from: 'wmbchildcare@backend.wise1ne.com',
  to: receipentEmail,
  ...(subject && { subject }),
  ...(body && { body }),
  html,
});

transporter.verify((error, success) => {
  if (error) {
    console.error("error in verifying transporter", error.message);
    // next(error);
    return; //next(error.message);
  }
  // console.log("email server is ready");
});

const parseEmailTemplate = async (templateType, reqBody, next) => {
  let template = null;
  let subject = null;
  switch (templateType) {
    case "signup":
      template = "signUpTemplate.html";
      subject = "Email Confirmation";
      break;
    
    case "employeesignup":
      template = "employeesignUpTemplate.html";
      subject = "Email Confirmation";
      break;

    case "accountVerification":
      template = "activateAccount.html";
      subject = "Account Activation";
      break;

    case "requestForgotPassword":
      template = "requestForgotPassword.html";
      subject = "Reset Password";
      break;
    
    case "employeeStatus":
        template = "changestatus.html";
        subject = "Focus Mode Change";
        break;

        case "clientStatus":
          template = "clientstatus.html";
          subject = "Focus Mode Change";
          break;
          case "clientCompanyverified":
            template = "clientCompanyverified.html";
            subject = "Account Verified";
            break;
  

    case "SubmitLandingPage":
      template = "LandingPage.html";
      subject = "Email From Landing Page";
      break;
    default:
      template;
  }

  if (!template) return next("target template not exist");

  template = path.join(rootPath, "utils", "emails", "templates", template);

  const html = await ejs.renderFile(template, reqBody);

  if (html) {
    return { html, subject };
  }
  return { html: null, subject };
};

const sendEmail = async (templateType, reqData, next) => {
  try {
    const template = await parseEmailTemplate(templateType, reqData, next);

    console.log("mail function called");
    const mailOption = createEmailOption({
      receipentEmail: reqData.email,
      html: template.html,
      subject: template.subject,
    });
    console.log("mail: " + mailOption);

    const sendInfo = await transporter.sendMail(mailOption);

    if (sendInfo) {
      console.log(
        `${templateType} email send successfully to ${reqData.email}`
      );
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = sendEmail;
