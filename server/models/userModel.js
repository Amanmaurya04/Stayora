const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {

username: {
    type:String,
    required:true,
    unique:true,
    trim:true,
},

email: {
    type:String,
    required:true,
    unique:true,
    trim:true,
    lowercase:true,
},

password: {
    type:String,
    required:true,
},

role:{
    type: String,
    enum:["Guest", "Host"],
    default:"Guest"
},

isHost:{
    type:Boolean,
    default:false
},

hostSince:{
type: Date,
 default: null,
},

profilePicture:{
type:String,
default:"images/default.png"
},

bio:{
type:String,
default:"Hey there"
},

isEmailVerified:{
type:Boolean,
default:false
},


contact:{
    type:Number,
    required:true,
},
    },

{
    timestamps:true,
}
);

const User = mongoose.model("User" , userSchema);


module.exports = User