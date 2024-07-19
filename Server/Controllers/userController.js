const Joi = require('joi');
const bcrypt = require('bcrypt');
const User = require("../Models/user");
const UserDTO = require("../DTO/userdto");
const JWTService = require("../Services/jwtServices");
const Token = require("../Models/token");

const passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$%])[A-Za-z\d@$%]{8,}$/

const userController = ({

    //register new User
    async register(req, res, next) {
        const regiesterSchema = Joi.object({
            name: Joi.string().max(30).required(),
            username: Joi.string().min(5).max(15).required(),
            email: Joi.string().email().required(),
            password: Joi.string().pattern(passwordPattern).required()
        })
        const { error } = regiesterSchema.validate(req.body);
        if (error) {
            return next(error);
        }
        const { name, username, email, password } = req.body;

        try {
            let checkusername = await User.findOne({ username: username });
            let checkemail = await User.findOne({ email: email });
            if (checkusername) {
                const error = {
                    status: 401,
                    message: "username already taken"
                }
                return next(error);
            }
            if (checkemail) {
                const error = {
                    status: 401,
                    message: "email already taken"
                }
                return next(error);
            }
            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = new User({
                name,
                username,
                email,
                password: hashedPassword
            })
            const user = await newUser.save();

            let token;
            try {
                token = JWTService.signToken({_id:user._id}, '60m');
            } catch (error) {
                return next(error);
            }
            await JWTService.storeToken(token, user._id);

            res.cookie('token', token, {
                maxAge: 1000*60*60*24,
                httpOnly: true
            })
            const userdto = new UserDTO(user);
            res.status(201).json({ message: "User Register Successfully", User: userdto, auth: true});

        } catch (error) {
            return next(error);
        }
    },

    //get all user for admin
    async getAlluser(req, res, next) {
        try {
            const allUser = await User.find({});
            const userdto = allUser.map(user => new UserDTO(user));
            res.status(201).json(userdto);
        } catch (error) {
            return next(error);
        }
    },

    //get user by id
    async getById(req, res, next) {
        try {
            const {token} = req.cookies;
            if(!token){
                const error = {
                    status:401,
                    message:"UnAuthorized Access"
                }
                return next(error);
            }
            let decodetoken;
            try {
                decodetoken = JWTService.verifyToken(token);
            } catch (error) {
                return next({
                    status:401,
                    message:"Invalid Access"
                });
            }
            let checkuser = await User.findById({_id:decodetoken._id});

            if (!checkuser) {
                const error = {
                    status: 401,
                    message: "User Does not exist"
                }
                return next(error);
            }
            else {
                const userdto = new UserDTO(checkuser);
                res.status(201).json(userdto);
            }
        } catch (error) {
            return next(error);
        }
    },

    //login user
    async login(req, res, next) {
        const loginSchema = Joi.object({
            username: Joi.string().min(5).max(15).required(),
            password: Joi.string().pattern(passwordPattern).required()
        })
        const {error} = loginSchema.validate(req.body);
        if(error){
            return next(error);
        }
        const {username, password} = req.body;

        try {
            const checkusername = await User.findOne({username:username});
            if(!checkusername){
                const error = {
                    status: 401,
                    message: "Invalid Username"
                }
                return next(error);
            }
            const checkpassword = await bcrypt.compare(password, checkusername.password);

            if(!checkpassword){
                const error = {
                    status: 401,
                    message: "Invalid Password"
                }
                return next(error);
            }

            const token = JWTService.signToken({_id:checkusername._id},'60m');
            try {
                const tokenRecord = await Token.updateOne({_id:checkusername._id},{token:token},{upset:true});
                if (!tokenRecord) {
                    const newToken = new Token({
                        userId: checkusername._id,
                        token: token
                    });
                    await newToken.save();
                }
            } catch (error) {
                return next(error);
            }
            res.cookie('token',token, {
                maxAge: 1000*60*60*24,
                httpOnly:true
            })

            const userdto = new UserDTO(checkusername);
            res.status(201).json({message:"User LogedIn Successfully", userdto, auth:true});

            
        } catch (error) {
            return next(error);
        }

    },

    //update user
    async update(req, res, next) {
        const {token} = req.cookies;
        if(!token){
            const error = {
                status:401,
                message: "UnAuthorized Access"
            }
            return next(error);
        }
        let decodetoken;
        try {
            decodetoken = await JWTService.verifyToken(token);
        } catch (error) {
            return next(error);
        }
        try {
            const checkuser = await User.findById({ _id:decodetoken._id});
            if (!checkuser) {
                const error = {
                    status: 401,
                    message: "User Does not exist"
                }
                return next(error);
            }
            else {
                const updateSchema = Joi.object({
                    name: Joi.string().max(30).optional(),
                    username: Joi.string().min(5).max(15).optional(),
                    email: Joi.string().email().optional(),
                    password: Joi.string().pattern(passwordPattern).optional()
                })
                const { error } = updateSchema.validate(req.body);
                if (error) {
                    return next(error);
                }
                const {name, username, email, password} = req.body;
                const updatefields = {};

                if(name) updatefields.name = name;
                if(username) updatefields.username = username;
                if(email) updatefields.email = email;
                if(password) updatefields.password = await bcrypt.hash(password, 10);
                
                const updateuser = await User.findByIdAndUpdate(decodetoken._id, updatefields, {new:true});
                const userdto = new UserDTO(updateuser);
                res.status(201).json({message:"User Update Successfully",updateuser: userdto});

            }
        } catch (error) {
            return next(error);
        }
    },



    async logout(req, res, next) {
        const {token} = req.cookies;
        if (!token) {
            const error = {
                status: 401,
                message: "UnAuthorized Access"
            };
            return next(error);
        }
        try {
            await Token.findOneAndDelete({token:token});
        } catch (error) {
            return next(error);
        }
        res.clearCookie('token');
        res.status(201).json({message:"Logout Successfully", auth:false});
    },

    //delete user account
    async delete(req, res, next) {
        try {
            const {token} = req.cookies;
            if(!token){
                const error = {
                    status: 401,
                    message: "UnAuthorized Access"
                };
                return next(error);
            }
            let decodetoken;
            try {
                decodetoken = JWTService.verifyToken(token);
            } catch (error) {
                return next(error);
            }
            
            const user = await User.findById({ _id: decodetoken._id });
            if (!user) {
                const error = {
                    status: 401,
                    message: "User Does not exist"
                }
                return next(error);
            }
            else {
                await User.findByIdAndDelete({ _id: decodetoken._id });
                res.clearCookie('token');
                res.status(201).json("User Account delete Successfully");
            }

        } catch (error) {
            return next(error);
        }

    }

})

module.exports = userController;