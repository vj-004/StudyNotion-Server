import { Router } from "express";
import { contactUs } from "../controllers/contactUs.controller.js";

export const ContactUsRoutes = Router();

ContactUsRoutes.post('/contact', contactUs);