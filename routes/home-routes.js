const express=require('express');
const authmiddleware = require("../middleware/auth-middleware");
const router = express.Router();


router.get("/welcome",authmiddleware,(req,res)=>{
    const {username,userId}=req.userInfo;
    res.json({
        success:true,
        message:'welcom to home page',
        user:{
            username,
            _id:userId,
        },
    });
});

module.exports=router;