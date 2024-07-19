const User = require("../Models/user");
const JWTService = require("../Services/jwtServices");

const auth = async (req, res, next) =>{
    const {token} = req.cookies;
    if(!token){
        const error = {
            status: 401,
            message: "UnAuthorized Access"
        }
        return next(error);
    }
    let decodeToken;
    try {
        decodeToken = JWTService.verifyToken(token);
    } catch (error) {
        return next({
            status:401,
            message:"Invalid Token"
        })
    }
    let user;
    try {
        user = await User.findById({_id:decodeToken._id});
        if(!user){
            const error = {
                status: 401,
                message: "UnAuthorized Access"
            }
            return next(error);
        }
    } catch (error) {
        return next(error);
    }
    next();
}
module.exports = auth;