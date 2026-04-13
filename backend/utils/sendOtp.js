const nodemailer = require('nodemailer');
const twilio = require('twilio');
require('dotenv').config();

// Nodemailer Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Twilio Setup (Only initialize if credentials exist)
let twilioClient;
if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
}

const sendOtp = async (identifier, otp) => {
    try {
        const isEmail = identifier.includes('@');

        if (isEmail) {
            // Send Email
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: identifier,
                subject: 'NexusChat - Your OTP Code',
                html: `<h3>Welcome to NexusChat!</h3><p>Your OTP code is: <b style="font-size: 20px; color: #4F46E5;">${otp}</b></p><p>This code is valid for 5 minutes.</p>`
            };
            await transporter.sendMail(mailOptions);
            console.log(`✉️ Email OTP sent to ${identifier}`);
        } else {
            // Send SMS (assuming identifier is a phone number with country code like +91)
            if (twilioClient) {
                await twilioClient.messages.create({
                    body: `Your NexusChat OTP is: ${otp}. Valid for 5 minutes.`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: identifier
                });
                console.log(`📱 SMS OTP sent to ${identifier}`);
            } else {
                console.log("⚠️ Twilio credentials missing. SMS not sent.");
            }
        }
        return true;
    } catch (error) {
        console.error("Error sending OTP:", error);
        return false;
    }
};

module.exports = sendOtp;