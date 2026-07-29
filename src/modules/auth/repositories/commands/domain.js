const { v4: uuidv4 } = require("uuid");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const hashHelper = require("../../../../helpers/utils/hash_helper");
const jwtHelper = require("../../../../helpers/auth/jwt_helper");
const {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} = require("../../../../helpers/errors");
const config = require("../../../../config/global_config");
const { addEmailJob } = require("../../../../helpers/queues/email.queue");
const verifyEmailTemplate = require("../../../../helpers/utils/verifyEmail");
const resetPasswordEmailTemplate = require("../../../../helpers/utils/resetPasswordEmail");

const ctx = "Auth-Command-Domain";

class Auth {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  // ─── Register ────────────────────────────────────────────────────────────────
  async register(payload) {
    const email = String(payload.email || "").trim().toLowerCase();
    const { password, full_name } = payload;

    const existingUser = await this.query.findUserByEmail(email);
    if (!existingUser.err) {
      return wrapper.error(new ConflictError("Email already registered"));
    }

    const passwordHash = await hashHelper.generateHash(password);
    const now = new Date();
    const userId = uuidv4();

    const userResult = await this.command.insertUser({
      id: userId,
      email,
      password_hash: passwordHash,
      full_name,
      role: "visitor",
      login_provider: "email",
      email_verified_at: null,
      last_login_at: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });

    if (userResult.err) {
      logger.error(ctx, "register", "Failed to insert user", userResult.err);
      return wrapper.error(userResult.err);
    }

    // Buat token verifikasi email
    const verificationToken = uuidv4();
    const tokenExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 jam

    const tokenResult = await this.command.insertToken({
      id: uuidv4(),
      user_id: userId,
      token: verificationToken,
      type: "email_verification",
      expires_at: tokenExpiry,
      used_at: null,
      created_at: now,
    });

    if (tokenResult.err) {
      logger.error(ctx, "register", "Failed to insert verification token", tokenResult.err);
      return wrapper.error(tokenResult.err);
    }

    // Kirim email verifikasi — link mengarah ke frontend Next.js
    const frontendUrl = config.get("/frontendUrl") || "http://localhost:3000";
    const verifyUrl = `${frontendUrl.replace(/\/$/, "")}/id/verify-email?token=${verificationToken}`;

    const emailHtml = verifyEmailTemplate({ name: full_name, verifyUrl });

    // Always log the verify URL so local/dev can complete verification without SMTP/Redis.
    logger.info(ctx, "register", "Email verification token generated", {
      userId,
      verificationToken,
      verifyUrl,
    });

    // Fire-and-forget: never block registration on mail delivery.
    void addEmailJob({
      to: email,
      subject: "Verify Your Email - Egi Media",
      html: emailHtml,
    }).catch((emailError) => {
      logger.error(ctx, "register", "Failed to send verification email", emailError);
    });

    logger.info(ctx, "register", "User registered successfully", { userId, email });

    return wrapper.data({
      id: userId,
      email,
      full_name,
      role: "visitor",
      login_provider: "email",
      email_verified_at: null,
      last_login_at: null,
      created_at: now,
      updated_at: now,
    });
  }

  // ─── Login ───────────────────────────────────────────────────────────────────
  async login(payload) {
    const email = String(payload.email || "").trim().toLowerCase();
    const password = payload.password;

    const userResult = await this.query.findUserByEmail(email);
    if (userResult.err) {
      return wrapper.error(new UnauthorizedError("Invalid email or password"));
    }

    const user = userResult.data;

    if (!user.password_hash) {
      return wrapper.error(
        new UnauthorizedError("This account uses social login. Please login with Google.")
      );
    }

    // Cek apakah email sudah diverifikasi
    if (!user.email_verified_at) {
      return wrapper.error(
        new UnauthorizedError("Please verify your email before logging in. If you didn't receive the email, please request a resend.")
      );
    }

    const isPasswordValid = await hashHelper.compareHash(
      String(password ?? ""),
      String(user.password_hash ?? ""),
    );
    if (!isPasswordValid) {
      return wrapper.error(new UnauthorizedError("Invalid email or password"));
    }

    // Legacy accounts may remain visitor after verify; promote once email is confirmed.
    let role = user.role;
    const loginUpdates = { last_login_at: new Date(), updated_at: new Date() };
    if (role === "visitor") {
      role = "member";
      loginUpdates.role = "member";
    }
    await this.command.updateUser({ id: user.id }, loginUpdates);

    const tokenPayload = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role,
    };

    const accessToken = await jwtHelper.generateAccessToken(tokenPayload);
    const refreshToken = await jwtHelper.generateRefreshToken({ id: user.id });

    logger.info(ctx, "login", "User logged in successfully", { userId: user.id, role });

    return wrapper.data({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: jwtHelper.getAccessTokenExpiresInSeconds(),
    });
  }

  // ─── Refresh Token ───────────────────────────────────────────────────────────
  async refreshToken(payload) {
    const { refresh_token } = payload;

    const verifyResult = await jwtHelper.verifyRefreshToken(refresh_token);
    if (verifyResult.err) {
      return wrapper.error(new UnauthorizedError(verifyResult.err.message));
    }

    const decoded = verifyResult.data;

    const userResult = await this.query.findUserById(decoded.id);
    if (userResult.err) {
      return wrapper.error(new UnauthorizedError("User not found"));
    }

    const user = userResult.data;

    let role = user.role;
    if (role === "visitor" && user.email_verified_at) {
      role = "member";
      await this.command.updateUser(
        { id: user.id },
        { role: "member", updated_at: new Date() }
      );
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role,
    };

    const newAccessToken = await jwtHelper.generateAccessToken(tokenPayload);
    const newRefreshToken = await jwtHelper.generateRefreshToken({ id: user.id });

    logger.info(ctx, "refreshToken", "Tokens refreshed", { userId: user.id, role });

    return wrapper.data({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      token_type: "Bearer",
      expires_in: jwtHelper.getAccessTokenExpiresInSeconds(),
    });
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────
  async logout(payload) {
    const { user_id } = payload;
    // Redis blacklist belum diaktifkan. Client wajib menghapus token di sisi mereka.
    logger.info(ctx, "logout", "User logged out", { user_id });
    return wrapper.data({ message: "Logged out successfully" });
  }

  // ─── Verify Email ────────────────────────────────────────────────────────────
  async verifyEmail(payload) {
    const { token } = payload;

    const tokenResult = await this.query.findTokenByValue(token, "email_verification");
    if (tokenResult.err) {
      return wrapper.error(new BadRequestError("Invalid or expired verification token"));
    }

    const tokenData = tokenResult.data;
    const now = new Date();

    if (tokenData.used_at) {
      return wrapper.error(new BadRequestError("Token has already been used"));
    }

    if (new Date(tokenData.expires_at) < now) {
      return wrapper.error(new BadRequestError("Verification token has expired"));
    }

    // Promote verified visitors to member so member-facing features work after login.
    const userResult = await this.query.findUserById(tokenData.user_id);
    const nextFields = { email_verified_at: now, updated_at: now };
    if (!userResult.err && userResult.data?.role === "visitor") {
      nextFields.role = "member";
    }

    await this.command.updateUser({ id: tokenData.user_id }, nextFields);

    await this.command.markTokenUsed({ id: tokenData.id }, { used_at: now });

    logger.info(ctx, "verifyEmail", "Email verified", {
      userId: tokenData.user_id,
      role: nextFields.role || userResult.data?.role,
    });

    return wrapper.data({ message: "Email verified successfully" });
  }

  // ─── Forgot Password ─────────────────────────────────────────────────────────
  async forgotPassword(payload) {
    const email = String(payload.email || "").trim().toLowerCase();

    const userResult = await this.query.findUserByEmail(email);
    // Selalu kembalikan 200 untuk menghindari user enumeration
    if (userResult.err) {
      logger.info(ctx, "forgotPassword", "Email not found, silently ignoring", { email });
      return wrapper.data({ message: "If this email is registered, a reset link has been sent" });
    }

    const user = userResult.data;
    const now = new Date();
    const resetToken = uuidv4();
    const tokenExpiry = new Date(now.getTime() + 60 * 60 * 1000); // 1 jam

    await this.command.insertToken({
      id: uuidv4(),
      user_id: user.id,
      token: resetToken,
      type: "password_reset",
      expires_at: tokenExpiry,
      used_at: null,
      created_at: now,
    });

    // Kirim email reset — link mengarah ke frontend Next.js
    const frontendUrl = config.get("/frontendUrl") || "http://localhost:3000";
    const resetUrl = `${frontendUrl.replace(/\/$/, "")}/id/reset-password?token=${resetToken}`;
    const emailHtml = resetPasswordEmailTemplate({
      name: user.full_name,
      resetUrl,
    });

    // Always log the reset URL so local/dev can complete reset without SMTP/Redis.
    logger.info(ctx, "forgotPassword", "Password reset token generated", {
      userId: user.id,
      resetToken,
      resetUrl,
    });

    // Fire-and-forget: never block the response on mail delivery.
    void addEmailJob({
      to: email,
      subject: "Reset Your Password - Egi Media",
      html: emailHtml,
    }).catch((emailError) => {
      logger.error(ctx, "forgotPassword", "Failed to send reset email", emailError);
    });

    return wrapper.data({ message: "If this email is registered, a reset link has been sent" });
  }

  // ─── Reset Password ──────────────────────────────────────────────────────────
  async resetPassword(payload) {
    const { token, new_password } = payload;

    const tokenResult = await this.query.findTokenByValue(token, "password_reset");
    if (tokenResult.err) {
      return wrapper.error(new BadRequestError("Invalid or expired reset token"));
    }

    const tokenData = tokenResult.data;
    const now = new Date();

    if (tokenData.used_at) {
      return wrapper.error(new BadRequestError("Token has already been used"));
    }

    if (new Date(tokenData.expires_at) < now) {
      return wrapper.error(new BadRequestError("Reset token has expired"));
    }

    const newPasswordHash = await hashHelper.generateHash(new_password);

    await this.command.updateUser(
      { id: tokenData.user_id },
      { password_hash: newPasswordHash, updated_at: now }
    );

    await this.command.markTokenUsed({ id: tokenData.id }, { used_at: now });

    logger.info(ctx, "resetPassword", "Password reset successfully", { userId: tokenData.user_id });

    return wrapper.data({ message: "Password reset successfully" });
  }

  // ─── Change Password ─────────────────────────────────────────────────────────
  async changePassword(payload) {
    const { user_id, old_password, new_password } = payload;

    const userResult = await this.query.findUserById(user_id);
    if (userResult.err) {
      return wrapper.error(new NotFoundError("User not found"));
    }

    const user = userResult.data;

    if (!user.password_hash) {
      return wrapper.error(
        new BadRequestError("Cannot change password for social login accounts")
      );
    }

    const isValid = await hashHelper.compareHash(old_password, user.password_hash);
    if (!isValid) {
      return wrapper.error(new UnauthorizedError("Old password is incorrect"));
    }

    const newPasswordHash = await hashHelper.generateHash(new_password);
    const now = new Date();

    await this.command.updateUser(
      { id: user_id },
      { password_hash: newPasswordHash, updated_at: now }
    );

    logger.info(ctx, "changePassword", "Password changed successfully", { user_id });

    return wrapper.data({ message: "Password changed successfully" });
  }

  // ─── Update Me (display name) ────────────────────────────────────────────────
  async updateMe(payload) {
    const { user_id, full_name } = payload;

    const userResult = await this.query.findUserById(user_id);
    if (userResult.err) {
      return wrapper.error(new NotFoundError("User not found"));
    }

    const now = new Date();
    const result = await this.command.updateUser(
      { id: user_id },
      { full_name, updated_at: now }
    );

    if (result.err) {
      logger.error(ctx, "updateMe", "Failed to update user", result.err);
      return wrapper.error(result.err);
    }

    const refreshed = await this.query.findUserById(user_id);
    if (refreshed.err) {
      return wrapper.error(new NotFoundError("User not found"));
    }

    const { password_hash, ...safeUser } = refreshed.data;
    logger.info(ctx, "updateMe", "User profile updated", { user_id });
    return wrapper.data(safeUser);
  }

  // ─── Google Login (OAuth Callback) ──────────────────────────────────────────
  async googleLogin(payload) {
    const { id: googleId, name, picture } = payload;
    const email = String(payload.email || "").trim().toLowerCase();

    const now = new Date();
    let userId;

    const existingUser = await this.query.findUserByEmail(email);

    if (existingUser.err) {
      // User belum ada — buat baru
      userId = uuidv4();
      const insertResult = await this.command.insertUser({
        id: userId,
        email,
        password_hash: null,
        full_name: name,
        // Google email is already verified → treat as member immediately.
        role: "member",
        login_provider: "google",
        email_verified_at: now,
        last_login_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });

      if (insertResult.err) {
        logger.error(ctx, "googleLogin", "Failed to create user from Google", insertResult.err);
        return wrapper.error(insertResult.err);
      }

      logger.info(ctx, "googleLogin", "New user created via Google OAuth", { userId, email });
    } else {
      // User sudah ada — update last_login_at (and promote verified visitors).
      userId = existingUser.data.id;
      const nextFields = { last_login_at: now, updated_at: now };
      if (existingUser.data.role === "visitor") {
        nextFields.role = "member";
      }
      await this.command.updateUser({ id: userId }, nextFields);
      logger.info(ctx, "googleLogin", "Existing user logged in via Google OAuth", { userId });
    }

    const userResult = await this.query.findUserById(userId);
    if (userResult.err) {
      return wrapper.error(userResult.err);
    }
    const user = userResult.data;

    const tokenPayload = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    };

    const accessToken = await jwtHelper.generateAccessToken(tokenPayload);
    const refreshToken = await jwtHelper.generateRefreshToken({ id: user.id });

    return wrapper.data({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: jwtHelper.getAccessTokenExpiresInSeconds(),
    });
  }

  // ─── Resend Verification ─────────────────────────────────────────────────────
  async resendVerification(payload) {
    const email = String(payload.email || "").trim().toLowerCase();
    const userResult = await this.query.findUserByEmail(email);
    if (userResult.err) {
      return wrapper.error(new NotFoundError("Email is not registered"));
    }

    const user = userResult.data;
    if (user.email_verified_at) {
      return wrapper.error(new BadRequestError("Email is already verified"));
    }

    if (user.login_provider !== "email") {
      return wrapper.error(new BadRequestError("This account uses social login"));
    }

    const now = new Date();
    const verificationToken = uuidv4();
    const tokenExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 jam

    const tokenResult = await this.command.insertToken({
      id: uuidv4(),
      user_id: user.id,
      token: verificationToken,
      type: "email_verification",
      expires_at: tokenExpiry,
      used_at: null,
      created_at: now,
    });

    if (tokenResult.err) {
      logger.error(ctx, "resendVerification", "Failed to insert verification token", tokenResult.err);
      return wrapper.error(tokenResult.err);
    }

    const frontendUrl = config.get("/frontendUrl") || "http://localhost:3000";
    const verifyUrl = `${frontendUrl.replace(/\/$/, "")}/id/verify-email?token=${verificationToken}`;

    const emailHtml = verifyEmailTemplate({ name: user.full_name, verifyUrl });

    logger.info(ctx, "resendVerification", "Email verification token resent", {
      userId: user.id,
      email,
      verificationToken,
      verifyUrl,
    });

    void addEmailJob({
      to: email,
      subject: "Verify Your Email - Egi Media",
      html: emailHtml,
    }).catch((emailError) => {
      logger.error(ctx, "resendVerification", "Failed to send verification email", emailError);
    });

    return wrapper.data({ message: "Verification email resent successfully" });
  }
}

module.exports = Auth;
