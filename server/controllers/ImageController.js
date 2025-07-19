import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import userModel from '../models/userModel.js';

const removeBgImage = async (req, res) => {
  try {
    const { clerkId } = req.body;

    if (!clerkId) {
      return res.status(400).json({ success: false, message: "clerkId is required" });
    }

    const user = await userModel.findOne({ clerkId });

    if (!user) {
      return res.json({ success: false, message: "User Not Found" });
    }

    if (user.creditBalance === 0) {
      return res.json({
        success: false,
        message: "No Credit Balance",
        creditBalance: user.creditBalance,
      });
    }

    const imagePath = req.file?.path;

    if (!imagePath) {
      return res.status(400).json({ success: false, message: "Image not provided" });
    }

    const imageFile = fs.createReadStream(imagePath);

    const formdata = new FormData();
    formdata.append('image_file', imageFile);

    const { data, headers } = await axios.post(
      'https://clipdrop-api.co/remove-background/v1', // ✅ Correct API
      formdata,
      {
        headers: {
          ...formdata.getHeaders(),
          'x-api-key': process.env.CLIPDROP_API,
        },
        responseType: 'arraybuffer',
      }
    );

    const base64Image = Buffer.from(data, 'binary').toString('base64');
    const resultImage = `data:image/png;base64,${base64Image}`;

    await userModel.findByIdAndUpdate(user._id, {
      creditBalance: user.creditBalance - 1,
    });

    res.json({
      success: true,
      resultImage,
      creditBalance: user.creditBalance - 1,
      message: "Background Removed",
    });
  } catch (error) {
    console.error("Remove BG Error:", error.message);

    if (error.response && error.response.data) {
      const errorMsg = Buffer.from(error.response.data).toString();
      return res.status(error.response.status).json({
        success: false,
        message: `ClipDrop Error: ${errorMsg}`,
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

export { removeBgImage };
