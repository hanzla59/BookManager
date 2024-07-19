const JWT = require('jsonwebtoken');
const Token = require("../Models/token");
const dotenv = require('dotenv');
dotenv.config();

const Token_Secret_Key = process.env.Token_Secret_Key;

class JWTService{
    static signToken(payload, expiryTime){
        return JWT.sign(payload, Token_Secret_Key, {expiresIn: expiryTime});
    }
    static verifyToken(token){
        return JWT.verify(token, Token_Secret_Key);
    }
    static async storeToken(token, userId){

        try {
            const newToken = new Token({
                token: token,
                userId: userId
            });
            await newToken.save();
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = JWTService;