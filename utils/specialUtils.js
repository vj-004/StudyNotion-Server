export const returnResponse = (res,code,result,message) => {
    return res.status(code).json({
        success: result,
        message: message
    });
}