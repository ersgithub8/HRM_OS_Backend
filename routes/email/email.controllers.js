const moment = require("moment");
const { ToWords } = require("to-words");
const Email = require("../../utils/email");
const prisma = require("../../utils/prisma");

// number to words cofiguration
const toWords = new ToWords({
  localeCode: "en-US",
  converterOptions: {
    currency: true,
    ignoreDecimal: false,
    ignoreZeroCurrency: false,
    doNotAddOnly: false,
    currencyOptions: {
      // can be used to override defaults for the selected locale
      name: "Dollar",
      plural: "Dollar",
      symbol: "$",
      fractionalUnit: {
        name: "Cent",
        plural: "Cent",
        symbol: "",
      },
    },
  },
});

const sendEmail = async (req, res) => {
  try {
    let invoiceData;
    // get settings data
    const settings = await prisma.appSetting.findUnique({
      where: {
        id: 1,
      },
    });
    if (req.query.type === "saleinvoice") {
      const { id, emailaddress } = req.query;
      // ===============START get the invoice information================
      const singleSaleInvoice = await prisma.saleInvoice.findUnique({
        where: {
          id: Number(id),
        },
        include: {
          saleInvoiceProduct: {
            include: {
              warehouseStock: true,
            },
          },
          customer: true,
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });
      // view the transactions of the sale invoice
      const transactions = await prisma.transaction.findMany({
        where: {
          related_id: Number(id),
          OR: [
            {
              type: "sale",
            },
            {
              type: "sale_return",
            },
          ],
        },
        include: {
          debit: {
            select: {
              name: true,
            },
          },
          credit: {
            select: {
              name: true,
            },
          },
        },
      });
      // transactions of the paid amount
      const transactions2 = await prisma.transaction.findMany({
        where: {
          type: "sale",
          related_id: Number(id),
          OR: [
            {
              debit_id: 1,
            },
            {
              debit_id: 2,
            },
          ],
        },
        include: {
          debit: {
            select: {
              name: true,
            },
          },
          credit: {
            select: {
              name: true,
            },
          },
        },
      });
      // for total return amount
      const returnSaleInvoice = await prisma.returnSaleInvoice.findMany({
        where: {
          saleInvoice_id: Number(id),
        },
        include: {
          returnSaleInvoiceProduct: {
            include: {
              warehouseStock: true,
            },
          },
        },
      });
      // calculate the discount given amount at the time of make the payment
      const transactions3 = await prisma.transaction.findMany({
        where: {
          type: "sale",
          related_id: Number(id),
          debit_id: 14,
        },
        include: {
          debit: {
            select: {
              name: true,
            },
          },
          credit: {
            select: {
              name: true,
            },
          },
        },
      });
      // calculate the total amount return back to customer for return sale invoice from transactions
      // transactions of the paid amount
      const transactions4 = await prisma.transaction.findMany({
        where: {
          type: "sale_return",
          related_id: Number(id),
          OR: [
            {
              credit_id: 1,
            },
            {
              credit_id: 2,
            },
          ],
        },
        include: {
          debit: {
            select: {
              name: true,
            },
          },
          credit: {
            select: {
              name: true,
            },
          },
        },
      });
      const paidAmountReturn = transactions4.reduce(
        (acc, curr) => acc + curr.amount,
        0
      );
      let status = "UNPAID";
      // sum total amount of all transactions
      const totalPaidAmount = transactions2.reduce(
        (acc, item) => acc + item.amount,
        0
      );
      // sum of total discount given amount at the time of make the payment
      const totalDiscountAmount = transactions3.reduce(
        (acc, item) => acc + item.amount,
        0
      );
      // check if total transaction amount is equal to total_amount - discount - return invoice amount
      const totalReturnAmount = returnSaleInvoice.reduce(
        (acc, item) => acc + item.total_amount,
        0
      );
      const dueAmount =
        singleSaleInvoice.total_amount -
        singleSaleInvoice.discount -
        totalPaidAmount -
        totalDiscountAmount -
        totalReturnAmount +
        paidAmountReturn;
      if (dueAmount === 0) {
        status = "PAID";
      }
      // calculate total unit_measurement
      const totalUnitMeasurement = singleSaleInvoice.saleInvoiceProduct.reduce(
        (acc, item) =>
          acc +
          Number(item.warehouseStock.unit_measurement) * item.product_quantity,
        0
      );
      invoiceData = {
        status,
        totalPaidAmount,
        totalReturnAmount,
        dueAmount,
        totalUnitMeasurement,
        singleSaleInvoice,
        returnSaleInvoice,
        transactions,
        totalDiscountAmount,
      };
      //================END get the invoice information================
      // ===============START invoice template================
      const html = `
      <html>
      <head>
      <style>
      .email {
        max-width: 480px;
        margin: 1rem auto;
        border-radius: 10px;
        border-top: #d74034 2px solid;
        border-bottom: #d74034 2px solid;
        box-shadow: 0 2px 18px rgba(0, 0, 0, 0.2);
        padding: 1.5rem;
        font-family: Arial, Helvetica, sans-serif;
      }
      .email .email-head {
        border-bottom: 1px solid rgba(0, 0, 0, 0.2);
        padding-bottom: 1rem;
      }
      .email .email-head .head-img {
        max-width: 240px;
        padding: 0 0.5rem;
        display: block;
        margin: 0 auto;
      }

      .email .email-head .head-img img {
        width: 100%;
      }
      .email-body .invoice-icon {
        max-width: 80px;
        margin: 1rem auto;
      }
      .email-body .invoice-icon img {
        width: 100%;
      }

      .email-body .body-text {
        padding: 2rem 0 1rem;
        text-align: center;
        font-size: 1.15rem;
      }
      .email-body .body-text.bottom-text {
        padding: 2rem 0 1rem;
        text-align: center;
        font-size: 0.8rem;
      }
      .email-body .body-text .body-greeting {
        font-weight: bold;
        margin-bottom: 1rem;
      }

      .email-body .body-table {
        text-align: left;
      }
      .email-body .body-table table {
        width: 100%;
        font-size: 1.1rem;
      }
      .email-body .body-table table .total {
        background-color: hsla(4, 67%, 52%, 0.12);
        border-radius: 8px;
        color: #d74034;
      }
      .email-body .body-table table .item {
        border-radius: 8px;
        color: #d74034;
      }
      .email-body .body-table table th,
      .email-body .body-table table td {
        padding: 10px;
      }
      .email-body .body-table table tr:first-child th {
        border-bottom: 1px solid rgba(0, 0, 0, 0.2);
      }
      .email-body .body-table table tr td:last-child {
        text-align: right;
      }
      .email-body .body-table table tr th:last-child {
        text-align: right;
      }
      .email-body .body-table table tr:last-child th:first-child {
        border-radius: 8px 0 0 8px;
      }
      .email-body .body-table table tr:last-child th:last-child {
        border-radius: 0 8px 8px 0;
      }
      .email-footer {
        border-top: 1px solid rgba(0, 0, 0, 0.2);
      }
      .email-footer .footer-text {
        font-size: 0.8rem;
        text-align: center;
        padding-top: 1rem;
      }
      .email-footer .footer-text a {
        color: #d74034;
      }
    </style>
  </head>
  <body>
    <div class="email">
      <div class="email-head">
      </div>
      <div class="email-body">
        <div class="body-text">
          <div class="body-greeting">
            Hello, ${invoiceData.singleSaleInvoice.customer.name}
          </div>
          Your Invoice Summary is below and status is ${invoiceData.status}!
        </div>
        <div class="body-table">
          <table>
            <tr class="item">
              <th>Descriptions</th>
              <th>Amount</th>
            </tr>
            <tr>
              <td>Total Invoice Amount</td>
              <td>${invoiceData.singleSaleInvoice.total_amount}</td>
            </tr>
            <tr>
              <td>Initial Discount (-)</td>
              <td>${invoiceData.singleSaleInvoice.discount}</td>
            </tr>            
            <tr>
              <td>Additional Discount (-)</td>
              <td>${invoiceData.totalDiscountAmount}</td>
            </tr>
            <tr>
              <td>Return Product's Amount (-)</td>
              <td>${invoiceData.totalReturnAmount}</td>
            </tr>
            <tr>
              <td>Total Paid Amount (-)</td>
              <td>${invoiceData.totalPaidAmount}</td>
            </tr>
            <tr class="total">
              <th>Due Amount</th>
              <th>${invoiceData.dueAmount}</th>
            </tr>
          </table>
        </div>
        <div class="body-text bottom-text">
          Thank you for purchasing with us.
        </div>
      </div>
      <div class="email-footer">
        <div class="footer-text">
          &copy; <a href="https://solution.omega.ac/"  target="_blank">solution.omega.ac</a>
        </div>
      </div>
    </div>
  </body>
  </html>`;
      //========================= Invoice Attachment =========================
      const content = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="X-UA-Compatible" content="ie=edge" />
          <title>Invoice</title>
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
            rel="stylesheet"
          />
            <style>
               
          .wrapper{
          display:grid;
          grid-template-columns:2fr 3fr 2fr;
          font-size: 12px;
          padding: 10px 0;
          width: 1000px;
          max-width: 90%;
          margin: 0 auto;
          grid-auto-rows: minmax(70px, auto);
          }
      
          .wrapper > div{
          padding:0.6em;
          }
      
          .box1{
          grid-column:1;
          grid-row:1;
          display: flex;
              align-items: center;
              justify-content: center;
          }
      
          .box2{
          grid-column:2;
          grid-row:1;
          text-align: center;
          }
      
          .box3{
          grid-column:3;
          grid-row:1;
          display: flex;
              align-items: center;
              justify-content: center;
          }
      
          .box4{
          grid-column:1/4;
          grid-row:2;
          text-align: center;
          }
      
          .box5{
          grid-column:1/2;
          grid-row:3;
          }
        
          .box6{
          grid-column:3/4;
          grid-row:3;
          }
      
          .box7{
          justify-content: stretch;
          grid-column:1/4;
          grid-row:4;
          }
      
          .box8{
          grid-column:1/2;
          grid-row:6;
          }
      
          .box9{
          grid-column:3/4;
          grid-row:5;
          }
      
          .box10{
            grid-column:3/4;
            grid-row:10;
            }
      
          .box11{
            grid-column:1/2;
            grid-row:10;
            }	
      
          .box12{
            grid-column:1/4;
            grid-row:11;
            text-align: center;
            }	
      
          .box13{
            grid-column:1/3;
            grid-row:5;
            }
      
          .box14{
            grid-column:1/4;
            grid-row:7;
            }
      
          .footer {
            position: fixed;
            left: 180;
            bottom: 0;
            text-align: center;
            width: 1000px;
            max-width: 90%;
            }
      
          body {
            font-family: "Inter", sans-serif;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          table.table1,
          table.table1 th,
          table.table1 td {
            border: 1px solid silver;
          }
          table.table1 th,
          table.table1 td {
            text-align: left;
            padding: 5px;
          }
          table.table1 tr:nth-child(even) {background-color: #f2f2f2;}
      
          table.table2 {
            border-collapse: collapse;
            width: 100%;
            }
            
          table.table2 th, table.table2 td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #ddd;
          }
          hr.hr1 {
            border-top: 1px dotted rgb(63, 63, 63);
            }
      
        </style>
        </head>
        <body>
          <div class="wrapper">
            
            <div class="box2">
                <h1>${settings.company_name}</h1>
                <h3>${settings.tag_line}</h3>
                <p>${settings.address}</p>
                <p>Mob: ${settings.phone}</p>
                <p>Email: ${settings.email}</p>
            </div>
            
            <div class="box4">
              <hr class="hr1">
              <h3 class="center">INVOICE</h3>
              <hr class="hr1">
             </div>
      
            <div class="box5">
              <table class="table2">
                <tr>
                  <th>Client ID</th>
                  <td>${invoiceData.singleSaleInvoice.customer.id}</td>
                </tr>
                <tr>
                  <th>Client Name</th>
                  <td>${invoiceData.singleSaleInvoice.customer.name}</td>
                </tr>
                <tr>
                  <th>Address</th>
                  <td>${invoiceData.singleSaleInvoice.customer.address}</td>
                </tr>
                <tr>
                  <th>Contact No</th>
                  <td>${invoiceData.singleSaleInvoice.customer.phone}</td>
                </tr>
              </table>
            </div>
      
            <div class="box6">
              <table class="table2">
                <tr>
                  <th>Invoice No</th>
                  <td>${invoiceData.singleSaleInvoice.id}</td>
                </tr>
                <tr>
                  <th>Invoice Date</th>
                  <td>${moment(invoiceData.singleSaleInvoice.date).format(
                    "ll"
                  )}</td>
                </tr>
                <tr>
                  <th>Sales Person</th>
                  <td>${invoiceData.singleSaleInvoice.user.username}</td>
                </tr>
              </table>
            </div>
      
            <div class="box7">
              <table class="table1">
                <thead>
                  <th>Sl</th>
                  <th>Product Description</th>
                  <th>Pack Size</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total Price</th>
                </thead>
                <tbody>
                  ${invoiceData.singleSaleInvoice.saleInvoiceProduct
                    .map((item, index) => {
                      return `
                    <tr>
                      <td>${index + 1}</td>
                      <td><p>${item.warehouseStock.name}</p></td>
                      <td>${item.warehouseStock.unit_measurement} ${
                        item.warehouseStock.unit_type
                      }</td>
                      <td>${item.product_quantity}</td>
                      <td>${item.product_sale_price}</td>
                      <td>${
                        item.product_quantity * item.product_sale_price
                      }</td>
                    </tr>
                    `;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>
      
            <div class="box8">
              <table class="table2">
                <tr>
                  <th>Invoice Status</th>
                  <td>${invoiceData.status}</td>
                </tr>
              </table>
            </div>
      
            <div class="box9">
              <table class="table2">
                <tr>
                  <th>Total Invoice Amount</th>
                  <td>${invoiceData.singleSaleInvoice.total_amount}</td>
                </tr>
                <tr>
                  <th>Initial Discount (-)</th>
                  <td>${invoiceData.singleSaleInvoice.discount}</td>
                </tr>
                <tr>
                  <th>Additional Discount (-)</th>
                  <td>${invoiceData.totalDiscountAmount}</td>
                </tr>
                <tr>
                  <th>Return Product's Amount (-)</th>
                  <td>${invoiceData.totalReturnAmount}</td>
                </tr>
                <tr>
                  <th>Total Paid Amount (-)</th>
                  <td>${invoiceData.totalPaidAmount}</td>
                </tr>
                <tr>
                  <th>Due Amount</th>
                  <td>${invoiceData.dueAmount}</td>
                </tr>
              </table>
            </div>
      
            <div class="box10">
              <hr>
              <p>Received By</p>
            </div>
      
            <div class="box11">
              <hr>
              <p>Authorized By</p>
            </div>
      
            <div class="box12">
              <hr>
              <p>${settings.footer}</p>
              <p>Powered by OMEGA SOLUTION | Contact: 01885 996601</p>
            </div>
      
            <div class="box13">
              <p><b>Due Amount In Words: </b>${toWords.convert(
                invoiceData.dueAmount,
                { currency: true }
              )}</p>
              <p><b>Notes: </b>${invoiceData.singleSaleInvoice.note}</p>
            </div>
          </div>
        </body>
      </html>
      `;
      //================END invoice template================
      const attachments = [
        {
          filename: "saleinvoice.html",
          content: content,
        },
      ];
      Email.email(
        emailaddress,
        "Sale Invoice",
        "Sale Invoice",
        html,
        attachments
      );
    }
    if (req.query.type === "purchaseinvoice") {
      const { emailaddress } = req.query;
      Email.email(emailaddress, "Test", "Text", "<h1>Test</h1>", attachments);
    }
    return res.status(200).json({ message: "Email sent" });
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = {
  sendEmail,
};
