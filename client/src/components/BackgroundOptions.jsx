import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";

const BackgroundOptions = () => {
  const { changeBackground } = useContext(AppContext);

  const handleColor = (e) => {
    changeBackground("color", e.target.value);
  };

  const handleUpload = (e) => {
    if (e.target.files[0]) {
      changeBackground("upload", e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-wrap gap-4 mt-6">
      {/* Transparent */}
      <button 
        onClick={() => changeBackground("transparent")}
        className="px-4 py-2 border rounded-md">
        Transparent
      </button>

      {/* Solid Color */}
      <input 
        type="color" 
        onChange={handleColor} 
        className="w-10 h-10 p-0 border rounded-md cursor-pointer" 
      />

      {/* Custom Upload */}
      <label className="px-4 py-2 border rounded-md cursor-pointer">
        Upload
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleUpload} 
          className="hidden"
        />
      </label>
    </div>
  );
};

export default BackgroundOptions;
