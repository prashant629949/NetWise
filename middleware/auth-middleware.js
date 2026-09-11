const jwt = require('jsonwebtoken');

const authmiddleware = (req,res,next)=>{
    const authheader = req.headers["authorization"];
    const token = authheader&&authheader.split(" ")[1];
    if(!token){
        return res.status(401).json({
            success:false,
            message:'access denied'
        })
    }
    try{
        const decodedToken = jwt.verify(token,process.env.JWT_SECRET_KEY);
        req.userInfo = decodedToken;
        next();
    }catch{
        return res.status(401).json({
            success: false,
            message: "access denied",
        })
    }
}
module.exports= authmiddleware;
