import { Router } from "express";
import auth, { isAdmin, isInstructor, isStudent } from "../middlewares/auth.js";
import { createCourse, getCourseDetails, showAllCourses } from "../controllers/course.controller.js";
import { createSection, deleteSection, updateSection } from "../controllers/section.controller.js";
import { createSubSection, deleteSubSection, updateSubSection } from "../controllers/subSection.controller.js";
import { categoryPageDetails, createCategory, showAllCategories } from "../controllers/category.controller.js";
import { createRating, getAllRatings, getAvgRating } from "../controllers/ratingsAndReview.controller.js";

export const CourseRoutes = Router();

// ********************************************************************************************************
//                                      Course routes
// ********************************************************************************************************

// Courses can Only be Created by Instructors
CourseRoutes.post("/createCourse", auth, isInstructor, createCourse);
//Add a Section to a Course
CourseRoutes.post("/addSection", auth, isInstructor, createSection);
// Update a Section
CourseRoutes.post("/updateSection", auth, isInstructor, updateSection);
// Delete a Section
CourseRoutes.post("/deleteSection", auth, isInstructor, deleteSection);
// Edit Sub Section
CourseRoutes.post("/updateSubSection", auth, isInstructor, updateSubSection);
// Delete Sub Section
CourseRoutes.post("/deleteSubSection", auth, isInstructor, deleteSubSection);
// Add a Sub Section to a Section
CourseRoutes.post("/addSubSection", auth, isInstructor, createSubSection);
// Get all Registered Courses
CourseRoutes.get("/getAllCourses", showAllCourses);
// Get Details for a Specific Courses
CourseRoutes.post("/getCourseDetails", getCourseDetails);

// ********************************************************************************************************
//                                      Category routes (Only by Admin)
// ********************************************************************************************************
// Category can Only be Created by Admin
// TODO: Put IsAdmin Middleware here
CourseRoutes.post("/createCategory", auth, isAdmin, createCategory);
CourseRoutes.get("/showAllCategories", showAllCategories);
CourseRoutes.post("/getCategoryPageDetails", categoryPageDetails);

// ********************************************************************************************************
//                                      Rating and Review
// ********************************************************************************************************
CourseRoutes.post("/createRating", auth, isStudent, createRating);
CourseRoutes.get("/getAverageRating", getAvgRating);
CourseRoutes.get("/getReviews", getAllRatings);

