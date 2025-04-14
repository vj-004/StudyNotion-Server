import nodemailer from 'nodemailer';

export const mailSender = async (email,title,body) => {
    try{

        let transporter = nodemailer.createTransport({
            host:process.env.MAIL_HOST,
            auth:{
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });

        let info = await transporter.sendMail({
            from:`StudyNotion`,
            to:`${email}`,
            subject:`${title}`,
            html: `${body}`
        });

        return info;

    }catch(error){
        console.log('Error in sending OTP mail to user');
        console.log(error);
    }


}