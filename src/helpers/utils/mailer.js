const nodemailer = require("nodemailer");
const config = require("../../config/global_config");

const mailConfig = config.get("/mailConfig");

const transporter = nodemailer.createTransport({
    host: mailConfig.host,
    port: Number(mailConfig.port),
    secure: mailConfig.secure === "true" || mailConfig.secure === true || Number(mailConfig.port) === 465,
    auth: {
        user: mailConfig.user,
        pass: mailConfig.pass,
    },
});

async function sendMail({ to, subject, html, bcc }) {
    const payload = {
        from: mailConfig.from,
        to,
        subject,
        html,
    };
    if (bcc) {
        payload.bcc = bcc;
    }
    return transporter.sendMail(payload);
}

module.exports = {
    sendMail,
};
