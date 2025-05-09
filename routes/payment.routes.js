import { Router } from "express";
import auth, { isStudent } from "../middlewares/auth.js";
import { capturePayment, verifySignature } from "../controllers/payment.controller.js";

export const PaymentRoutes = Router();

PaymentRoutes.post("/capturePayment", auth, isStudent, capturePayment)
PaymentRoutes.post("/verifySignature", verifySignature)