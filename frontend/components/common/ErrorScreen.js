// components/common/ErrorScreen.js
"use client";

import { AlertTriangle, ArrowLeft, MessageCircle } from "lucide-react";

const ErrorScreen = ({ onBack, onContactSupport }) => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-5">
      {/* Card Container */}
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div
          className="bg-white p-8 flex flex-col items-center"
          style={{
            borderRadius: 30,
            boxShadow: "0px 8px 40px rgba(0,0,0,0.2)",
          }}
        >
          {/* Error Icon */}
          <div
            className="w-20 h-20 rounded-full bg-[#F5C518]/20 flex items-center justify-center mb-6"
          >
            <AlertTriangle size={40} className="text-[#F5C518]" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-900 mb-3 text-center">
            Whoops! Something went wrong
          </h2>

          {/* Subtitle */}
          <p className="text-gray-500 text-sm text-center leading-relaxed mb-8 max-w-xs">
            Try again or contact{" "}
            <button
              onClick={onContactSupport}
              className="text-[#F5C518] font-medium hover:underline inline-flex items-center gap-1"
            >
              <MessageCircle size={14} />
              Chat support
            </button>{" "}
            if you need additional help.
          </p>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            {/* Primary Button - Yellow */}
            <button
              onClick={onBack}
              className="w-full h-[50px] bg-[#F5C518] hover:bg-[#d4a815] text-black 
                         font-semibold rounded-[25px] transition-all flex items-center 
                         justify-center gap-2 shadow-lg shadow-[#F5C518]/30"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>

            {/* Secondary Button */}
            <button
              onClick={() => window.location.reload()}
              className="w-full h-[50px] border border-gray-200 text-gray-700 
                         font-semibold rounded-[25px] hover:bg-gray-50 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-gray-500 text-xs mt-6">
          Error Code: 500 | If problem persists, please contact support
        </p>
      </div>
    </div>
  );
};

export default ErrorScreen;