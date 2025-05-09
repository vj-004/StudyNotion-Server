import { Router } from "express";
import { changePassword, login, sendOtp, signUp } from "../controllers/auth.controller.js";
import { resetPassword, resetPasswordToken } from "../controllers/resetPassword.controller.js";
import auth from "../middlewares/auth.js";

export const UserRoutes = Router();

// Routes for Login, Signup, and Authentication

// ********************************************************************************************************
//                                      Authentication routes
// ********************************************************************************************************

// Route for user login
UserRoutes.post("/login", login)

// Route for user signup
UserRoutes.post("/signup", signUp)

// Route for sending OTP to the user's email
UserRoutes.post("/sendotp", sendOtp)

// Route for Changing the password
UserRoutes.post("/changepassword", auth, changePassword)

// ********************************************************************************************************
//                                      Reset Password
// ********************************************************************************************************

// Route for generating a reset password token
UserRoutes.post("/reset-password-token", resetPasswordToken)

// Route for resetting user's password after verification
UserRoutes.post("/reset-password", resetPassword)