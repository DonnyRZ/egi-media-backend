module.exports = ({ name, resetUrl }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      background-color: #f3f4f6;
      color: #1f2937;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f3f4f6;
      padding: 40px 0;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
      padding: 35px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 40px 30px;
      line-height: 1.6;
    }
    .content h2 {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      margin-top: 0;
      margin-bottom: 20px;
      letter-spacing: -0.3px;
    }
    .content p {
      font-size: 15px;
      color: #4b5563;
      margin-bottom: 24px;
    }
    .cta-container {
      text-align: center;
      margin: 35px 0;
    }
    .btn-reset {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
    }
    .footer {
      background-color: #f9fafb;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #f3f4f6;
    }
    .footer p {
      font-size: 12px;
      color: #9ca3af;
      margin: 0 0 8px 0;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 30px 0;
    }
    .alternative-link {
      font-size: 13px;
      color: #6b7280;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>EGI MEDIA</h1>
      </div>
      <div class="content">
        <h2>Reset Your Password</h2>
        <p>Hi <strong>${name || "there"}</strong>,</p>
        <p>We received a request to reset the password for your Egi Media account. Click the button below to choose a new password:</p>
        
        <div class="cta-container">
          <a href="${resetUrl}" class="btn-reset" target="_blank">Reset Password</a>
        </div>
        
        <p>This link will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.</p>
        
        <div class="divider"></div>
        
        <p class="alternative-link">
          If you're having trouble clicking the button, copy and paste the link below into your web browser:<br>
          <a href="${resetUrl}" target="_blank" style="color: #2563eb;">${resetUrl}</a>
        </p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Egi Media. All rights reserved.</p>
        <p>You received this email because a password reset was requested for your account.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
