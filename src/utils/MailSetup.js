// emailService.js
const nodemailer = require('nodemailer');

// 1. Initialize the Transporter once

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465, 
    secure: true, 
    auth: {
      user: 'your mail',
      pass: 'your app password', 
    },
  });

// 2. Define the Mail Options generator (optional, but clean)
const verifyUser = (recipientEmail, otp) => {
    return {
        from: 'your mail',
        to: recipientEmail,
        subject: 'Your Protego Verification Code',
        // The HTML content you provided
        html: `<!DOCTYPE html>
                <html>
                <head>
                    <title>Protego Verification Code</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0;">
                    <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #dddddd; border-radius: 8px; background-color: #ffffff;">
                        <div style="border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 20px;">
                            <h1 style="color: #007bff; font-size: 24px; margin: 0;">Protego Verification</h1>
                        </div>
                        <p style="font-size: 16px;">Hello,</p>
                        <p style="font-size: 16px;">You requested a one-time verification code for your **Protego** account.</p>
                        <div style="text-align: center; margin: 30px 0; background-color: #f4f4f4; padding: 20px; border-radius: 4px; border: 1px dashed #cccccc;">
                            <p style="font-size: 18px; margin: 0;">Your One-Time Password (OTP) is:</p>
                            <h2 style="font-size: 36px; color: #dc3545; letter-spacing: 5px; margin: 10px 0;">${otp}</h2>
                        </div>
                        <p style="font-size: 16px; color: #dc3545; font-weight: bold;">
                            ⚠️ This code is only valid for **5 minutes**. Please enter it promptly to complete your verification.
                        </p>
                        <p style="font-size: 14px; margin-top: 30px; color: #666666;">
                            If you did not request this code, please ignore this email. Do not share this code with anyone.
                        </p>
                    </div>
                </body>
                </html>`,
    };
};

const passwordResetOTP = (recipientEmail, otp) => {
    return {
        from: 'yourmail@example.com',
        to: recipientEmail,
        subject: 'Protego Password Reset OTP',
        html: `<!DOCTYPE html>
                <html>
                <head>
                    <title>Protego Password Reset OTP</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0;">
                    <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #dddddd; border-radius: 8px; background-color: #ffffff;">
                        <div style="border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 20px;">
                            <h1 style="color: #007bff; font-size: 24px; margin: 0;">Protego Password Reset</h1>
                        </div>
                        <p style="font-size: 16px;">Hello,</p>
                        <p style="font-size: 16px;">You requested a password reset for your <strong>Protego</strong> account.</p>
                        <div style="text-align: center; margin: 30px 0; background-color: #f4f4f4; padding: 20px; border-radius: 4px; border: 1px dashed #cccccc;">
                            <p style="font-size: 18px; margin: 0;">Your One-Time Password (OTP) is:</p>
                            <h2 style="font-size: 36px; color: #dc3545; letter-spacing: 5px; margin: 10px 0;">${otp}</h2>
                        </div>
                        <p style="font-size: 16px; color: #dc3545; font-weight: bold;">
                            ⚠️ This OTP is only valid for <strong>5 minutes</strong>. Please enter it promptly to reset your password.
                        </p>
                        <p style="font-size: 14px; margin-top: 30px; color: #666666;">
                            If you did not request this, please ignore this email. Do not share this OTP with anyone.
                        </p>
                    </div>
                </body>
                </html>`
    };
};


// 3. Define the main function to send the email (using async/await for better control)
const sendOTPEmail = async (recipientEmail, otp) => {
    const mailOptions = verifyUser(recipientEmail, otp);
    
    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('OTP Email successfully sent:', info.response);
        return info;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        // Throw the error so the calling function can handle the failure
        throw new Error('Failed to send OTP email.');
    }
};

const passwordResetMail = async (recipientEmail, otp) => {
    const mailOptions = passwordResetOTP(recipientEmail, otp);
    
    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('OTP Email successfully sent:', info.response);
        return info;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        // Throw the error so the calling function can handle the failure
        throw new Error('Failed to send OTP email.');
    }
};

// 4. Export the function
module.exports = {
    sendOTPEmail,
};