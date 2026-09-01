import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
    service: "gmail",
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false,
    },
});
export const sendEmail = async ({ email, subject, message }) => {
    return await transporter.sendMail({
        from: `"Redmit" <${process.env.EMAIL_USERNAME}>`,
        to: email,
        subject,
        text: message,
    });
};
export const sendWelcomeEmail = async (email, fullName, username) => {
    const subject = "Welcome to Redmit 🎉";
    const message = `
Hi ${fullName || username},

Welcome to Redmit!

Your account has been successfully created.

Account Details
----------------------------------------
Name     : ${fullName || "N/A"}
Username : ${username}
Email    : ${email}
----------------------------------------

You can now access Redmit and explore our digital services, opportunities, and marketplace.

For your security, please keep your password confidential.

We're excited to have you with us!

Best regards,
Redmit Team

https://redmit.com
`;
    return await sendEmail({
        email,
        subject,
        message,
    });
};
export const sendPasswordResetLink = async (email, resetLink) => {
    const subject = "Reset Your Redmit Password";
    const message = `
Hello,

We received a request to reset your Redmit account password.

Click the link below to create a new password:

${resetLink}

This link will expire in 10 minutes.

If you did not request a password reset, please ignore this email.

For your security, do not share this link with anyone.

Best regards,
Redmit Team

https://redmit.com
`;
    return await sendEmail({
        email,
        subject,
        message,
    });
};
// export const sendPasswordResetOTP = async (email: string, otp: string) => {
//   const subject = "Redmit Password Reset Code";
//   const message = `
// Hello,
// We received a request to reset your Redmit account password.
// Your verification code is:
// ${otp}
// This code will expire in 10 minutes.
// If you did not request a password reset, please ignore this email.
// For your security, never share this code with anyone.
// Best regards,
// Redmit Team
// https://redmit.com
// `;
//   console.log("Sending password reset email to:", email);
//   console.log("Email subject:", subject);
//   console.log("Email message:", message);
//   return await sendEmail({ email, subject, message });
// };
