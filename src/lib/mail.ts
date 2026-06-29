import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key_for_development");
  }
  return resend;
}

export async function sendEnrollmentEmail(data: {
  email: string;
  name: string;
  tempPassword: string;
  role: string;
  invoice?: {
    id: string;
    amount: number;
    dueDate: string;
    description: string;
  };
}) {
  try {
    const { email, name, tempPassword, role, invoice } = data;
    
    if (!process.env.RESEND_API_KEY) {
      console.log("\n--- SIMULATED EMAIL ONBOARDING ---");
      console.log(`To: ${email}`);
      console.log(`Subject: Welcome to Cianna German School - Your ${role} Account`);
      console.log(`Credentials - Email: ${email} | Temp Password: ${tempPassword}`);
      if (invoice) {
        console.log(`Auto-generated Invoice: ${invoice.id} | Amount: ${invoice.amount} KSh | Due: ${invoice.dueDate} | Desc: ${invoice.description}`);
      }
      console.log("-----------------------------------\n");
      return { success: true, simulated: true };
    }

    const client = getResend();
    
    let invoiceHtml = "";
    if (invoice) {
      invoiceHtml = `
        <!-- Invoice Details Card -->
        <div style="background-color: #f0f7ff; border: 1px solid #c2e0ff; padding: 20px; border-radius: 12px; margin: 20px 0; font-family: sans-serif;">
          <h3 style="color: #1e3a8a; margin-top: 0; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Pending Enrollment Invoice</h3>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="padding: 6px 0; color: #475569; font-weight: 600;">Invoice Reference:</td>
              <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: bold; color: #0f172a;">${invoice.id}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #475569; font-weight: 600;">Description:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #0f172a;">${invoice.description}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #475569; font-weight: 600;">Due Date:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #ef4444;">${invoice.dueDate}</td>
            </tr>
            <tr style="border-top: 1px dashed #cbd5e1;">
              <td style="padding: 12px 0 0 0; color: #1e3a8a; font-size: 16px; font-weight: 800;">Total Amount:</td>
              <td style="padding: 12px 0 0 0; text-align: right; font-size: 18px; font-weight: 900; color: #256ff1;">${invoice.amount.toLocaleString()} KSh</td>
            </tr>
          </table>
        </div>
      `;
    }

    await client.emails.send({
      from: "Cianna Portal <onboarding@resend.dev>", // Replace with your verified domain
      to: email,
      subject: `Welcome to Cianna German School - Your ${role} Account`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 14px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #256ff1; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">Cianna German School</h1>
            <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px; font-weight: 500;">Your Gateway to the German Language</p>
          </div>
          
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 800; margin-top: 0;">Willkommen, ${name}!</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 10px 0;">Your enrollment has been completed successfully. We are excited to welcome you as a student at Cianna German School!</p>
          
          <h3 style="color: #0f172a; font-size: 14px; font-weight: 800; margin: 25px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">Portal Login Credentials</h3>
          <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 10px 0;">Below are your temporary credentials to access the learning portal:</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; margin: 15px 0;">
            <p style="margin: 5px 0; font-size: 14px; color: #334155;"><strong>Portal URL:</strong> <a href="${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}" style="color: #256ff1; text-decoration: underline; font-weight: bold;">${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}</a></p>
            <p style="margin: 5px 0; font-size: 14px; color: #334155;"><strong>Email/Username:</strong> ${email}</p>
            <p style="margin: 5px 0; font-size: 14px; color: #334155;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 3px 6px; border-radius: 6px; font-family: monospace; font-size: 13px; font-weight: bold; color: #0f172a;">${tempPassword}</code></p>
          </div>
          <p style="color: #ef4444; font-size: 13px; font-weight: 700; margin-top: 10px;">⚠️ Important: You will be required to change this password upon your first login for account security.</p>
          
          ${invoiceHtml}

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center; line-height: 1.5; margin: 0;">This email was automatically generated by the Cianna German School Portal. If you have any inquiries regarding your enrollment or payment, please reply directly to the administration.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send enrollment email:", error);
    return { success: false, error };
  }
}

export async function sendPaymentConfirmationEmail(data: {
  email: string;
  name: string;
  invoiceId: string;
  amountPaid: number;
  receiptNumber: string;
  balance: number;
}) {
  try {
    const { email, name, invoiceId, amountPaid, receiptNumber, balance } = data;

    if (!process.env.RESEND_API_KEY) {
      console.log("\n--- SIMULATED EMAIL PAYMENT RECEIPT ---");
      console.log(`To: ${email}`);
      console.log(`Subject: Payment Confirmation - Invoice ${invoiceId}`);
      console.log(`Receipt: ${receiptNumber} | Amount: ${amountPaid} KSh | Remaining Balance: ${balance} KSh`);
      console.log("----------------------------------------\n");
      return { success: true, simulated: true };
    }

    const client = getResend();

    await client.emails.send({
      from: "Cianna Portal <payments@resend.dev>", // Replace with your verified domain
      to: email,
      subject: `Payment Confirmation - Invoice ${invoiceId}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 14px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #10b981; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">Payment Received!</h1>
            <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px; font-weight: 500;">Cianna German School Portal</p>
          </div>
          
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 800; margin-top: 0;">Dear ${name},</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 10px 0;">We have successfully received your payment of <strong>${amountPaid.toLocaleString()} KSh</strong> via M-PESA. Thank you for your payment!</p>
          
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 12px; margin: 20px 0; font-family: sans-serif;">
            <h3 style="color: #15803d; margin-top: 0; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Receipt Details</h3>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse; margin-top: 10px;">
              <tr>
                <td style="padding: 6px 0; color: #475569; font-weight: 600;">Invoice Reference:</td>
                <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: bold; color: #0f172a;">${invoiceId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #475569; font-weight: 600;">Transaction Receipt:</td>
                <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: bold; color: #0f172a;">${receiptNumber}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #475569; font-weight: 600;">Amount Paid:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #15803d;">${amountPaid.toLocaleString()} KSh</td>
              </tr>
              <tr style="border-top: 1px dashed #cbd5e1;">
                <td style="padding: 12px 0 0 0; color: #475569; font-size: 14px; font-weight: 600;">Remaining Balance:</td>
                <td style="padding: 12px 0 0 0; text-align: right; font-size: 16px; font-weight: 900; color: ${balance <= 0 ? "#15803d" : "#ef4444"};">${balance <= 0 ? "FULLY PAID" : `${balance.toLocaleString()} KSh`}</td>
              </tr>
            </table>
          </div>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center; line-height: 1.5; margin: 0;">This email was automatically generated by the Cianna German School Portal. If you have any questions, please reply directly to the administration.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send payment confirmation email:", error);
    return { success: false, error };
  }
}
