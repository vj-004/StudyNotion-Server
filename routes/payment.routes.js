import { Router } from "express";
import auth, { isStudent } from "../middlewares/auth.js";
import { capturePayment, verifyPayment } from "../controllers/payment.controller.js";

export const PaymentRoutes = Router();

PaymentRoutes.post("/capturePayment", auth, isStudent, capturePayment)
PaymentRoutes.post("/verifySignature", auth, isStudent, verifyPayment);