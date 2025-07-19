import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import userModel from '../models/userModel.js';

// Controller function to remove background from image
const removeBgImage = async (req, res) => {
  try {
    const { clerkId } = req.body;

    if (!clerkId) {
      return res.status(400).json({ success: false, message: "clerkId is required" });
    }

    const user = await userModel.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.creditBalance === 0) {
      return res.status(403).json({
        success: false,
        message: "No credits left",
        creditBalance: user.creditBalance,
      });
    }

    const imagePath = req.file?.path;
    if (!imagePath) {
      return res.status(400).json({ success: false, message: "Image file is missing" });
    }

    const imageFile = fs.createReadStream(imagePath);
    const formdata = new FormData();
    formdata.append('image_file', imageFile);

    const { data } = await axios.post('https://clipdrop-api.co/cleanup/v1', formdata, {
      headers: {
        ...formdata.getHeaders(), // Important: include correct headers for multipart/form-data
        'x-api-key': process.env.CLIPDROP_API,
      },
      responseType: 'arraybuffer',
    });

    const base64Image = Buffer.from(data, 'binary').toString('base64');
    const resultImage = `data:${req.file.mimetype};base64,${base64Image}`;

    // Decrement creditBalance safely and return updated user
    const updatedUser = await userModel.findByIdAndUpdate(
      user._id,
      { $inc: { creditBalance: -1 } },
      { new: true } // return updated document
    );

    res.json({
      success: true,
      resultImage,
      creditBalance: updatedUser.creditBalance,
      message: "Background removed successfully",
    });

  } catch (error) {
    console.error("Remove BG Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { removeBgImage };
