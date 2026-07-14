const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: process.env.MAIL_SECURE == 465, // true for 465, false for other ports
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
    // tls: {
    //   rejectUnauthorized: false, // 🔥 penting buat local/dev
    // },
});

async function sendMail({ to, subject, html }) {
    return transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        html,
    });
}

module.exports = {
    sendMail,
};
