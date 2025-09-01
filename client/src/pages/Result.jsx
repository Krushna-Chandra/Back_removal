import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";

const Result = () => {
  const { resultImage, image, changeBackground } = useContext(AppContext);

  // Wrapper to call context function
  const applyBackground = (type, option) => {
    changeBackground(type, option);
  };

  return (
    <div className="mx-4 my-3 lg:mx-44 mt-14 min-h-[75vh]">
      <div className="bg-white rounded-lg px-8 py-6 drop-shadow-sm">
        {/* Image Container */}
        <div className="flex flex-col sm:grid grid-cols-2 gap-8">
          {/* --- Left Side: Original -------- */}
          <div>
            <p className="font-semibold text-gray-600 mb-2">Original</p>
            <img
              className="rounded-md border"
              src={image ? URL.createObjectURL(image) : ""}
              alt=""
            />
          </div>

          {/* ----- Right Side: Background Removed ----- */}
          <div className="flex flex-col">
            <p className="font-semibold text-gray-600 mb-2">
              Background Removed
            </p>
            <div className="rounded-md border border-gray-300 h-full relative bg-layer overflow-hidden">
              <img src={resultImage ? resultImage : ""} alt="" />
              {!resultImage && image && (
                <div className="absolute right-1/2 bottom-1/2 transform translate-x-1/2 translate-y-1/2">
                  <div className="border-4 border-violet-600 rounded-full h-12 w-12 border-t-transparent animate-spin "></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🔹 Background Options */}
        {resultImage && (
          <div className="mt-6">
            {/* Standard options */}
            <div className="flex gap-4 flex-wrap">
              {/* Transparent */}
              <button
                onClick={() => applyBackground("transparent")}
                className="px-4 py-2 border rounded-md"
              >
                Transparent
              </button>

              {/* Solid Colors */}
              <input
                type="color"
                onChange={(e) => applyBackground("color", e.target.value)}
                className="w-10 h-10 p-0 border rounded-md cursor-pointer"
              />

              {/* Custom Upload */}
              <label className="px-4 py-2 border rounded-md cursor-pointer">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => applyBackground("upload", e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>

            
          </div>
        )}

        {/* ----- Buttons -------- */}
        {resultImage && (
          <div className="flex justify-center sm:justify-end items-center flex-wrap gap-4 mt-6">
            <button className="px-8 py-2.5 text-violet-600 text-sm border border-violet-600 rounded-full hover:scale-105 transition-all duration-700">
              Try another image
            </button>
            <a
              href={resultImage}
              download
              className="px-8 py-2.5 text-white text-sm bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full hover:scale-105 transition-all duration-700"
            >
              Download image
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Result;
