import { instance } from "../config/razorpay.js";
import Course from "../models/Course.js";
import User from "../models/User.js";
import { mailSender } from "../utils/mailSender.js";
import { returnResponse } from "../utils/specialUtils.js";

//capture the payment and initiate the razorpay order
export const capturePayment = async (req,res) => {
    //get course id and user id
    const userId = req.user.id;
    const {courseId} = req.body;
    //validation
    if(!courseId){
        return returnResponse(res,400,false,"Please provide valid course id");
    }
    if(!userId){
        return returnResponse(res,404,false,"User not found");
    }
    let course;
    try{

        course = await Course.findById(courseId);
        if(!course){
            return returnResponse(res,404,false,"Cannot find course");
        }
        const uid = new mongoose.Types.ObjectId(userId);
        if(course.studentsEnrolled.includes(uid)){
            return returnResponse(res,200,false,"Student already enrolled in this course");
        }
    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"can't get course");
    }
    //order created
    const amount = course.price;
    const currency = "INR";

    const options = {
        amount: amount*100,
        currency,
        receipt: Math.random(Date.now()).toString(),
        notes:{
            courseId: courseId,
            userId,
        }
    };

    try{

        const paymentResponse = await instance.orders.create(options);
        console.log(paymentResponse);
        return returnResponse(res,200,true,{
            courseName: course.courseName,
            courseDescription: course.courseDescription,
            thumbnail: course.thumbnail,
            orderId: paymentResponse.order_id,
            currency: paymentResponse.currency,
            amount: paymentResponse.amount
        });

    }catch(error){
        console.log(error)
        return returnResponse(res,500,false,"could not initaite order");
    }
}

export const verifySignature = async (req,res) => {

    const webHookSecret = process.env.WEBHOOK_SECRET;

    const signature = req.headers("x-razorpay-signature");

    const shasum = crypto.createHmac('sha256', webHookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if(signature === digest){
        console.log('Payment is authorized');

        const {courseId, userId} = req.body.payload.payment.entity.notes;
        try{

            //enroll student and enrole the course in student
            const enrolledCourse = await Course.findByIdAndUpdate(
                {_id: courseId},
                {
                    $push:{studentsEnrolled: userId},
                },
                {
                    new: true,
                }
            );

            if(!enrolledCourse){
                return returnResponse(res,500,false,"Course not found");
            }

            console.log(enrolledCourse);

            const enrolledStudent = await User.findOneAndUpdate(
                {_id: userId},
                {$push:{courses: courseId}},
                {new: true}
            );

            if(!enrolledStudent){
                //remove this user from course
                const unenrollStudent = await Course.findOneAndUpdate(
                    {_id: courseId},
                    {$pull:{courses: userId}},
                    {new: true}
                );
                return returnResponse(res,500,false,"Student not found");
            }

            console.log(enrolledStudent);

            const mailResponse = await mailSender(
                enrolledStudent.email,
                "Congratulations from StudyNotion",
                "Congratulations into new StudyNotion course"
            );

            console.log(mailResponse);

            return returnResponse(res,200,true,"Signature verified and course added");



        }catch(error){
            console.log(error);
            return returnResponse(res,500,false,error.message);
        }

    }
     
    return returnResponse(res,400,false,"Invalid request");

}