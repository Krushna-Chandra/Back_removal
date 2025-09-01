import React, { useState, createContext } from "react";
import { useAuth, useUser, useClerk } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext(null);

const AppContextProvider = (props) => {
  const [credit, setCredit] = useState(false);
  const [image, setImage] = useState(false);
  const [resultImage, setResultImage] = useState(false);

  // NEW: keep the transparent cutout so we can recompose on demand
  const [baseCutout, setBaseCutout] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  const loadCreditsData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(backendUrl + "/api/user/credits", {
        headers: { token },
      });
      if (data.success) setCredit(data.credits);
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const removeBg = async (imgFile) => {
    try {
      if (!isSignedIn) return openSignIn();
      setImage(imgFile);
      setResultImage(false);
      setBaseCutout(false);

      navigate("/result");

      const token = await getToken();
      const formData = new FormData();
      imgFile && formData.append("image_file", imgFile);

      const { data } = await axios.post(
        backendUrl + "/api/image/remove-bg",
        formData,
        { headers: { token } }
      );

      if (data.success) {
        // Save both the original transparent PNG and current display
        setBaseCutout(data.resultImage);
        setResultImage(data.resultImage);
        data.creditBalance && setCredit(data.creditBalance);
      } else {
        toast.error(data.message);
        data.creditBalance && setCredit(data.creditBalance);
        if (data.creditBalance === 0) navigate("/buy");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // ---- Helpers to compose images on the client (no backend needed) ----
  const loadImageEl = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // requires CORS on your image host
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const composeWithColor = async (cutoutSrc, color) => {
    const cutout = await loadImageEl(cutoutSrc);
    const canvas = document.createElement("canvas");
    const w = cutout.naturalWidth || cutout.width;
    const h = cutout.naturalHeight || cutout.height;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color || "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(cutout, 0, 0, w, h);

    return canvas.toDataURL("image/png");
  };

  const composeWithImage = async (cutoutSrc, bgSrc) => {
    const [cutout, bg] = await Promise.all([
      loadImageEl(cutoutSrc),
      loadImageEl(bgSrc),
    ]);

    const canvas = document.createElement("canvas");
    const w = cutout.naturalWidth || cutout.width;
    const h = cutout.naturalHeight || cutout.height;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");

    // "cover" the canvas with the bg image
    const scale = Math.max(w / bg.width, h / bg.height);
    const dw = bg.width * scale;
    const dh = bg.height * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;

    ctx.drawImage(bg, dx, dy, dw, dh);
    ctx.drawImage(cutout, 0, 0, w, h);

    return canvas.toDataURL("image/png");
  };

  // ---- PUBLIC: called by your UI buttons ----
  const changeBackground = async (type, option) => {
    try {
      if (!isSignedIn) return openSignIn();
      if (!baseCutout) {
        toast.error("No cutout yet. Remove the background first.");
        return;
      }

      if (type === "transparent") {
        setResultImage(baseCutout);
        return;
      }

      if (type === "color") {
        const out = await composeWithColor(baseCutout, option || "#ffffff");
        setResultImage(out);
        return;
      }

      if (type === "upload") {
        if (!(option instanceof File)) {
          toast.error("Please choose an image file.");
          return;
        }
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const out = await composeWithImage(baseCutout, e.target.result);
            setResultImage(out);
          } catch (err) {
            console.error(err);
            toast.error("Failed to apply uploaded background.");
          }
        };
        reader.onerror = () => toast.error("Failed to read the file.");
        reader.readAsDataURL(option);
        return;
      }




      toast.error("Unknown background type.");
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const value = {
    credit,
    setCredit,
    loadCreditsData,
    backendUrl,
    image,
    setImage,
    removeBg,
    resultImage,
    setResultImage,
    changeBackground, // <- expose to UI
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};





export default AppContextProvider;
