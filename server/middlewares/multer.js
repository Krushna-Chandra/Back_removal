import multer from "multer";

// creating multer middle for parsing formdata

const storage = multer.diskStorage({
    filename: function(re,file,callback){
       callback(null , `${Date.now()}_${file.originalname}`) // ✅ correct
    }
})

const   upload = multer({storage})

export default upload