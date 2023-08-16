const prisma = require("../../../utils/prisma");
const calculatePayslip = require("../../../utils/calculatePayslip");

//create a new employee
const calculatePayroll = async (req, res) => {
  try {
    const { salaryMonth, salaryYear } = req.query;
    const allEmployeeSalary = await calculatePayslip(salaryMonth, salaryYear);

    return res.status(200).json(allEmployeeSalary);
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({ message: error.message });
  }
};

const generatePayslip = async (req, res) => {
  try {
    const payslip = await prisma.payslip.createMany({
      data: req.body.map((item) => {
        return {
          userId: item.userId,
          salaryMonth: item.salaryMonth,
          salaryYear: item.salaryYear,
          salary: item.salary,
          paidLeave: item.paidLeave,
          unpaidLeave: item.unpaidLeave,
          monthlyHoliday: item.monthlyHoliday,
          publicHoliday: item.publicHoliday,
          workDay: item.workDay,
          shiftWiseWorkHour: item.shiftWiseWorkHour,
          monthlyWorkHour: item.monthlyWorkHour,
          hourlySalary: item.hourlySalary,
          workingHour: item.workingHour,
          salaryPayable: item.salaryPayable,
          bonus: item.bonus,
          bonusComment: item.bonusComment,
          deduction: item.deduction,
          deductionComment: item.deductionComment,
          totalPayable: item.totalPayable + item.bonus - item.deduction,
        };
      }),
      skipDuplicates: true,
    });
    return res.status(200).json(payslip);
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({ message: error.message });
  }
};

const getAllPayslip = async (req, res) => {
  if (req.query.value === "monthWise") {
    const { paymentStatus, salaryMonth, salaryYear } = req.query;
    try {
      const allPayslip = await prisma.payslip.findMany({
        where: {
          AND: {
            salaryMonth: parseInt(salaryMonth),
            salaryYear: parseInt(salaryYear),
            paymentStatus: paymentStatus,
          },
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              id: true,
            },
          },
        },
        orderBy: {
          id: "desc",
        },
      });
      return res.status(200).json(allPayslip);
    } catch (error) {
      console.log(error.message);
      return res.status(400).json({ message: error.message });
    }
  } else {
    try {
      const allPayslip = await prisma.payslip.findMany({
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              id: true,
            },
          },
        },
        orderBy: {
          id: "desc",
        },
      });
      return res.status(200).json(allPayslip);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getSinglePayslip = async (req, res) => {
  try {
    const singlePayslip = await prisma.payslip.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        user: true,
      },
    });
    // remove the password from the response singlePayslip
    delete singlePayslip.user.password;

    return res.status(200).json(singlePayslip);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updatePayslip = async (req, res) => {
  try {
    const updatedPayslip = await prisma.payslip.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        bonus: req.body.bonus,
        bonusComment: req.body.bonusComment,
        deduction: req.body.deduction,
        deductionComment: req.body.deductionComment,
      },
    });
    return res.status(200).json(updatedPayslip);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// make payment to the payslip and update the payment status
const makePayment = async (req, res) => {
  try {
    // check if the payslip is already paid
    const checkPayslip = await prisma.payslip.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });
    if (checkPayslip.paymentStatus === "PAID") {
      return res.status(400).json({ message: "Payslip already paid" });
    }
    const updatedPayslip = await prisma.payslip.update({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            id: true,
          },
        },
      },
      data: {
        paymentStatus: "PAID",
      },
    });
    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(),
        debit_id: 10,
        credit_id: 1,
        particulars: `Salary paid to ${updatedPayslip.user.firstName} ${updatedPayslip.user.lastName} for the month of ${updatedPayslip.salaryMonth}-${updatedPayslip.salaryYear}`,
        amount: updatedPayslip.totalPayable,
        type: "salary",
        related_id: updatedPayslip.id,
      },
    });

    return res.status(200).json({ updatedPayslip, transaction });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  calculatePayroll,
  generatePayslip,
  getAllPayslip,
  getSinglePayslip,
  updatePayslip,
  makePayment,
};
