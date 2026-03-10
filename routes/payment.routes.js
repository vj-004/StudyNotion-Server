import { Router } from "express";
import auth, { isStudent } from "../middlewares/auth.js";
import { capturePayment, sendPaymentSuccessEmail, verifyPayment } from "../controllers/payment.controller.js";

export const PaymentRoutes = Router();

PaymentRoutes.post("/capturePayment", auth, isStudent, capturePayment)
PaymentRoutes.post("/verifyPayment", auth, isStudent, verifyPayment);
PaymentRoutes.post("/sendPaymentSuccessEmail", auth, isStudent, sendPaymentSuccessEmail);