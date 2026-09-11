const express = require('express');
const mongoose = require('mongoose');
const User = require('../model/user');
const image = require('../model/image');
const router = express.Router();
const authmiddleware = require('../middleware/auth-middleware');
const uploadmiddleware = require('../middleware/upload-middleware');
const { uploadProfileImageController, fetchalltheImages, fetchAllOtherImages,deleteImageController } = require('../controller/image-controller');

// upload and fetch routes
router.post('/profile-upload', authmiddleware, uploadmiddleware.single('file'), uploadProfileImageController);
router.get('/myimages', authmiddleware, fetchalltheImages);
router.get('/allimages', authmiddleware, fetchAllOtherImages);
router.delete("/:id", authmiddleware, deleteImageController);



module.exports = router;
