const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username :{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true
    },
    password:{
        type:String,
        required:true
    },
    profileImage: {
        type: String,
        default: "default.png"
    }
},{timestamps :true});

module.exports =mongoose.model("User",UserSchema);