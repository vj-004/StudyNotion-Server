import mongoose from "mongoose";
import { instance } from "../config/razorpay.js";
import Course from "../models/Course.js";
import User from "../models/User.js";
import { mailSender } from "../utils/mailSender.js";
import { returnResponse } from "../utils/specialUtils.js";
import { courseEnrollmentEmail } from "../mail/templates/courseEnrollmentEmail.js";
import { paymentSuccessEmail } from "../mail/templates/paymentSuccessEmail.js";
import crypto from "crypto";

export const capturePayment = async (req,res) => {

    const {courses} = req.body;
    const userId = req.user.id;
    
    if(courses.length == 0){
        return returnResponse(res,400,false,"No courses bought");
    }
    let totalAmount = 0;
    let boughtCourses = [];
    for(const course_id of courses){
        let course;
        try{

            course = await Course.findById(course_id);
            if(!course){
                return returnResponse(res,200,false,"Could not find course");
            }

            const uid = new mongoose.Types.ObjectId(userId);
            if(course.studentsEnrolled.includes(uid)){
                return returnResponse(res,200,false,"Student already enrolled in a course");
            }

            boughtCourses.push(course);

            totalAmount += course.price;

        }catch(error){
            console.log(error);
            return returnResponse(res,500,false,"Internal server error in capturing payment",error.message);
        }
    }

    const options = {
        amount: totalAmount * 100,
        currency: "INR",
        receipt: Math.random(Date.now()).toString(),
    };

    try{

        const paymentResponse = await instance.orders.create(options);
        res.json({
            success: true,
            message: "Payment Capture Successful",
            data: paymentResponse,
            courses: boughtCourses
        });

    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Could not initiate order");
    }
}




export const verifyPayment = async (req,res) => {

    const razorpay_order_id = req.body?.razorpay_order_id;
    const razorpay_payment_id = req.body?.razorpay_payment_id;
    const razorpay_signature = req.body?.razorpay_signature;
    const courses = req.body?.courses;
    const userId =  req.user.id;

    if(!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courses || !userId){
        return returnResponse(res,400,false,"Payment failed");
    }
    // console.log('req.body in verify payment is working fine: ', req.body);
    let body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

    if(expectedSignature === razorpay_signature){

        // enroll the student

        await enrollStudent(courses, userId, res);

        //return respose

        return returnResponse(res,200,true,"Payment Verified");
    }

    return returnResponse(res,400,false,"Payment failed");

}

const enrollStudent = async (courses, userId, res) => {

    if(!courses || !userId){
        return returnResponse(res,400,false,"Please provide data for courses and userId");
    }
    for(let courseId of courses){
        try{

            const enrolledCourse = await Course.findOneAndUpdate(
                {_id: courseId},
                {$push: {studentsEnrolled: userId}},
                {new: true}
            );

            if(!enrolledCourse){
                return returnResponse(res,500,false,"Course not found");
            }
            const enrolledStudent = await User.findByIdAndUpdate(userId,
                {
                    $push: {
                        courses: courseId
                    }
                },
                {new: true}
            );

            // send mail about enrolled courses to student

            const emailResponse = await mailSender(enrolledStudent.email,
                `Successfully enrolled into ${enrolledCourse.courseName}`, 
                courseEnrollmentEmail(enrolledCourse.courseName, enrolledStudent.firstName
            ));

            console.log('Email sent to the student', emailResponse.response);
            
        }catch(error){
            console.log(error);
            return returnResponse(res,500,false,error.message);
        }
    }


}

export const sendPaymentSuccessEmail = async (req,res) => {

    // console.log('req.body: ', req.body);
    const {orderId, paymentId, amount} = req.body;

    const userId = req.user.id;

    if(!orderId || !paymentId || !amount || !userId){
        return returnResponse(res,400,false,"Plase provide all the details");
    }

    try{

        const enrolledStudent = await User.findById(userId);
        if(!enrolledStudent){
            return returnResponse(res,400,false,"Student not found");
        }
        // console.log('enrolled student: ', enrolledStudent);
        await mailSender(enrolledStudent.email, `Payment Received`, paymentSuccessEmail(`${enrolledStudent.firstName} ${enrolledStudent.lastName}` , amount/100, orderId, paymentId));

    }catch(error){
        console.log('Error in sending payment verification mail ', error)
        return returnResponse(res,500,false,"Could not send email");
    }

}


//capture the payment and initiate the razorpay order
// export const capturePayment = async (req,res) => {
//     //get course id and user id
//     const userId = req.user.id;
//     const {courseId} = req.body;
//     //validation
//     if(!courseId){
//         return returnResponse(res,400,false,"Please provide valid course id");
//     }
//     if(!userId){
//         return returnResponse(res,404,false,"User not found");
//     }
//     let course;
//     try{

//         course = await Course.findById(courseId);
//         if(!course){
//             return returnResponse(res,404,false,"Cannot find course");
//         }
//         const uid = new mongoose.Types.ObjectId(userId);
//         if(course.studentsEnrolled.includes(uid)){
//             return returnResponse(res,200,false,"Student already enrolled in this course");
//         }
//     }catch(error){
//         console.log(error);
//         return returnResponse(res,500,false,"can't get course");
//     }
//     //order created
//     const amount = course.price;
//     const currency = "INR";

//     const options = {
//         amount: amount*100,
//         currency,
//         receipt: Math.random(Date.now()).toString(),
//         notes:{
//             courseId: courseId,
//             userId,
//         }
//     };

//     try{

//         const paymentResponse = await instance.orders.create(options);
//         console.log(paymentResponse);
//         return returnResponse(res,200,true,{
//             courseName: course.courseName,
//             courseDescription: course.courseDescription,
//             thumbnail: course.thumbnail,
//             orderId: paymentResponse.order_id,
//             currency: paymentResponse.currency,
//             amount: paymentResponse.amount
//         });

//     }catch(error){
//         console.log(error)
//         return returnResponse(res,500,false,"could not initaite order");
//     }
// }

// export const verifySignature = async (req,res) => {

//     const webHookSecret = process.env.WEBHOOK_SECRET;

//     const signature = req.headers("x-razorpay-signature");

//     const shasum = crypto.createHmac('sha256', webHookSecret);
//     shasum.update(JSON.stringify(req.body));
//     const digest = shasum.digest("hex");

//     if(signature === digest){
//         console.log('Payment is authorized');

//         const {courseId, userId} = req.body.payload.payment.entity.notes;
//         try{

//             //enroll student and enrole the course in student
//             const enrolledCourse = await Course.findByIdAndUpdate(
//                 {_id: courseId},
//                 {
//                     $push:{studentsEnrolled: userId},
//                 },
//                 {
//                     new: true,
//                 }
//             );

//             if(!enrolledCourse){
//                 return returnResponse(res,500,false,"Course not found");
//             }

//             console.log(enrolledCourse);

//             const enrolledStudent = await User.findOneAndUpdate(
//                 {_id: userId},
//                 {$push:{courses: courseId}},
//                 {new: true}
//             );

//             if(!enrolledStudent){
//                 //remove this user from course
//                 const unenrollStudent = await Course.findOneAndUpdate(
//                     {_id: courseId},
//                     {$pull:{courses: userId}},
//                     {new: true}
//                 );
//                 return returnResponse(res,500,false,"Student not found");
//             }

//             console.log(enrolledStudent);

//             const mailResponse = await mailSender(
//                 enrolledStudent.email,
//                 "Congratulations from StudyNotion",
//                 "Congratulations into new StudyNotion course"
//             );

//             console.log(mailResponse);

//             return returnResponse(res,200,true,"Signature verified and course added");



//         }catch(error){
//             console.log(error);
//             return returnResponse(res,500,false,error.message);
//         }

//     }
     
//     return returnResponse(res,400,false,"Invalid request");

// }