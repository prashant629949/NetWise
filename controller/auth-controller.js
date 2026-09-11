const User = require('../model/user');
const Image = require('../model/image');
const Post = require('../model/post');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require("cloudinary").v2;

const getPublicIdFromCloudinaryUrl = (url) => {
    if (!url) return null;
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^/.]+$/);
    return match ? decodeURIComponent(match[1]) : null;
};



const registerUser = async (req,res)=>{
    try{
        const {username,email,password}=req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, and password are required'
            });
        }

        const userexist = await User.findOne({$or:[{username},{email}]});
        if(userexist){
            return res.status(400).json({
                success:false,
                message:'User already exist try with a diffrent username'
            })
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password,salt);

        const newUser = await User({
            username,
            email,
            password:hashPassword
        });
        await newUser.save();
        if(newUser){
            res.status(200).json({
                success:true,
                message:'User register successfully'
            })
        }else{
            res.status(402).json({
                success:false,
                message:'Unable to register'
            })
        }
    }catch(e){
        console.log(e);
        res.status(400).json({
            success:false,
            message:'Something went wrong'
        })
    }
}

const loginUser = async (req,res)=>{
    try{
        const {username ,password}= req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        if (!process.env.JWT_SECRET_KEY) {
            return res.status(500).json({
                success: false,
                message: 'JWT secret is not configured'
            });
        }

        const checkinguser = await User.findOne({username});
        if(!checkinguser){
            return res.status(400).json({
                success:false,
                message:'username is invalid'
            })
        }
        const matchPassword = await bcrypt.compare(password,checkinguser.password);
        if (!matchPassword) {
            return res.status(401).json({
                success: false,
                message: "invalid password !",
            })
        }

        const accesstoken = jwt.sign({
            userId:checkinguser.id,
            username:checkinguser.username,
        },process.env.JWT_SECRET_KEY,{expiresIn:'30m'});
        res.status(201).json({
            success:true,
            message:'login successfull',
            token:accesstoken
        });
    }catch(e){
        console.log(e);
        res.status(400).json({
            success:false,
            message:'something went wrong'
        })
    }
}

const updateUsername = async (req,res)=>{
    try {
        const userId = req.userInfo.userId;
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ success: false, message: "Username is required" });
        }

        const existingUser = await User.findOne({ username, _id: { $ne: userId } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Username is already taken" });
        }

        await User.findByIdAndUpdate(userId, { username }, { runValidators: true });

        res.json({ success: true, message: "Username updated successfully" });

    } catch (error) {
        console.error("Error updating username:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


const changePassword = async (req,res)=>{
    try{
        const userId = req.userInfo.userId;

        const {oldPassword,newpassword} =req.body;

        if (!oldPassword || !newpassword) {
            return res.status(400).json({
                success: false,
                message: 'Old password and new password are required'
            });
        }

        const user = await User.findById(userId);
        if(!user){
            return res.status(401).json({
                success:false,
                message:'User not found'
            });
        }
        const isPasswordMatch = await bcrypt.compare(oldPassword,user.password);
        if(!isPasswordMatch){
            return res.status(401).json({
                success:false,
                message:'Old Password Not Match! Please Try Again'
            })
        }
        const salt= await bcrypt.genSalt(10);
        const newHashPassword = await bcrypt.hash(newpassword,salt)

        user.password=newHashPassword;
        await user.save();

        res.status(200).json({
            success:true,
            message:'Password updated Successfully'
        })

    }catch(e){
        console.log(e);
        res.status(400).json({
            success:false,
            message:'something went wrong'
        })
    }
}

const deleteAccount = async (req, res) => {
    try {
      const userId = req.userInfo.userId;
  
      //Delete POSTS (and their media)
      const posts = await Post.find({ uploadedBy: userId });
  
      for (let post of posts) {
        if (post.mediaUrl) {
          const publicId = post.publicId || getPublicIdFromCloudinaryUrl(post.mediaUrl);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId, {
              resource_type: post.mediaType === "video" ? "video" : "image",
            });
          }
        }
      }
  
      await Post.deleteMany({ uploadedBy: userId });
  
      //Delete PROFILE IMAGES
      const images = await Image.find({ uploadedBy: userId });
  
      for (let img of images) {
        if (img.url) {
          const publicId = img.url.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        }
      }
  
      await Image.deleteMany({ uploadedBy: userId });
  
      //Delete USER
      await User.findByIdAndDelete(userId);
  
      res.status(200).json({
        success: true,
        message: "Account and all data deleted successfully",
      });
  
    } catch (err) {
      console.error("DELETE ACCOUNT ERROR:", err);
      res.status(500).json({
        success: false,
        message: "Failed to delete account",
      });
    }
  };

module.exports = {registerUser,loginUser,changePassword,deleteAccount,updateUsername};
