const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");


const signup = async( req , res ) => {
   console.log("BODY:" , req.body);
try{
        const{ username , email , password , contact } =req.body;
    if (!username || !email || !password || !contact) {
       return res.status(400).json({
        message:"Please provide username, email , contact num & password",
       });
    }


const existingUser = await User.findOne({email});
if (existingUser) { 
    return res.status(400).json({
        message:"Email already exists",
    });
} 

const existingUsername = await User.findOne({username});
if(existingUsername){
   return res.status(400).json({
        message:"Username already taken",
    });
}

const hashedPassword = await bcrypt.hash(password,10);

const newUser = new User ({
    username,
    email,
    password:hashedPassword,
    contact


});

await newUser.save();

 return res.status(201).json({
    message:"User registered successfully",
    user:{
        id:newUser.id,
        username:newUser.username,
        email:newUser.email,
        contact:newUser.contact,

    },
});


} catch(error) {
console.log("Signup error:",error)

res.status(500).json({
    message:"Something went wrong",
});

}

};

const login = async ( req , res ) => {

    try {

        const {email , password } =req.body;

        if(!email || !password){
            return res.status(400).json({
                message:"Please provide email and password"
            });
        }

const user = await User.findOne({email});

if(!user){
    return res.status(401).json({
        message:"Invalid email or password",
    });
}

const isPasswordCorrect = await bcrypt.compare(
    password,
    user.password
);

if(!isPasswordCorrect){
    return res.status(401).json({
        message: "Invalid email or password",
    });
}


const token = jwt.sign(
    {
        id:user._id,
    },
    process.env.JWT_SECRET,
    {
        expiresIn:"1d"
    }
);

res.status(200).json({
    message:"Login Successful",
    token,
    user:{
        id:user._id,
        username:user.username,
        email:user.email,
       role: user.role,
    isHost: user.isHost
    },
});
    }

    catch(error){
        console.log("Login error:",error);

        res.status(500).json({
            message:"Something went wrong",
        });
    }
};

module.exports = { signup , login };
