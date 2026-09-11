const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null, uploadDir);
    },
    filename:function(req,file,cb){
        cb(null,
            file.fieldname
            +"-"+Date.now()
            +path.extname(file.originalname));
    }
});

const checkFileFilter = (req, file, cb) => {
    const allowed = ["image/", "video/"];
    if (allowed.some((type) => file.mimetype.startsWith(type))) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed!"));
    }
  };
/*const checkFileFilter =(req, file, cb)=>{
    const ext = file.originalname.toLowerCase();
    if(file.mimetype.startsWith("image") || ext.endsWith(".heic")){
        cb(null,true);
    }else{
        cb(new Error('not an image!please upload an image'));
    }
};*/

const upload = multer({
    storage:storage,
    fileFilter:checkFileFilter,
    limits:{
        fileSize:50*1024*1024
    }
});

module.exports=upload;
