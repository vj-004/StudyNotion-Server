import { Router } from "express";
import auth, { isInstructor } from "../middlewares/auth.js";
import { deleteAccount, getAllUserDetails, getEnrolledCourses, instructorDashboardDetails, updateDisplayPicture, updateProfile } from "../controllers/profile.controller.js";

export const ProfileRoutes = Router();

// ********************************************************************************************************
//                                      Profile routes
// ********************************************************************************************************
// Delet User Account
ProfileRoutes.delete("/deleteProfile",auth , deleteAccount)
ProfileRoutes.put("/updateProfile", auth, updateProfile)
ProfileRoutes.get("/getUserDetails", auth, getAllUserDetails)
// Get Enrolled Courses
ProfileRoutes.get("/getEnrolledCourses", auth, getEnrolledCourses)
ProfileRoutes.put("/updateDisplayPicture", auth, updateDisplayPicture)
ProfileRoutes.get("/instructorDashboardData", auth, isInstructor, instructorDashboardDetails);