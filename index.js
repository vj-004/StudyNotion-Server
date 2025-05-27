import express from "express";
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import { cloudinaryConnect } from "./config/cloudinary.js";
import cors from 'cors';
import { returnResponse } from "./utils/specialUtils.js";
import fileUpload from "express-fileupload";
import { UserRoutes } from "./routes/user.routes.js";
import { ProfileRoutes } from "./routes/profile.routes.js";
import { PaymentRoutes } from "./routes/payment.routes.js";
import { CourseRoutes } from "./routes/course.routes.js";
import { ContactUsRoutes } from "./routes/contactUs.routes.js";

dotenv.config();
const PORT = process.env.PORT || 4000;

connectDB();

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
    })
);
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

cloudinaryConnect();


app.use('/api/v1/auth',UserRoutes); // user routes
app.use('/api/v1/profile',ProfileRoutes); // profile routes
app.use('/api/v1/payment',PaymentRoutes); // payments routes
app.use('/api/v1/course',CourseRoutes); // course routes
app.use('/api/v1/reach', ContactUsRoutes);

app.get('/', (req,res) => {
    return returnResponse(res,200,true,"Your server is up and running...");
});

app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
});

