// components/common/NotFoundPage.js
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Home, HelpCircle, Map, Headphones } from "lucide-react";

const NotFoundPage = () => {
  const router = useRouter();

  const goHome = () => router.push("/");
  const goBack = () => router.back();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #000000 0%, #2B2000 100%)",
      }}
    >
      {/* Background Stars Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#F5C518] rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.2,
              animationDuration: `${Math.random() * 3 + 2}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Decorative Glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-[#F5C518]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] bg-[#F5C518]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Content */}
      <div className="text-center z-10 w-full max-w-lg flex flex-col items-center">
        {/* Logo Placeholder */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-white">
            <div className="w-10 h-10 bg-[#F5C518] rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-lg">C</span>
            </div>
            <span className="text-2xl font-bold tracking-wide">Cureli</span>
          </div>
        </div>

        {/* 404 Visual */}
        <div className="relative mb-6">
          <h1
            className="text-[120px] sm:text-[160px] font-black leading-none select-none"
            style={{
              background: "linear-gradient(180deg, #F5C518 0%, #F5C518/20 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 60px rgba(245, 197, 24, 0.3)",
            }}
          >
            404
          </h1>
        </div>

        {/* Title */}
        <h2
          className="text-xl sm:text-2xl font-light text-white tracking-[0.15em] uppercase mb-4"
          style={{ color: "#AAAAAA" }}
        >
          Page Not Found
        </h2>

        {/* Divider */}
        <div className="w-16 h-1 bg-gradient-to-r from-transparent via-[#F5C518]/50 to-transparent rounded-full mb-6" />

        {/* Description */}
        <p className="text-sm sm:text-base text-gray-400 mb-10 max-w-sm leading-relaxed px-4">
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved to a new location.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full px-4">
          {/* Primary Button */}
          <button
            onClick={goHome}
            className="flex-1 h-[50px] bg-[#F5C518] hover:bg-[#d4a815] text-black 
                       font-semibold rounded-[25px] transition-all flex items-center 
                       justify-center gap-2 shadow-lg shadow-[#F5C518]/30"
          >
            <Home size={18} />
            Back to Home
          </button>

          {/* Secondary Button */}
          <button
            onClick={goBack}
            className="flex-1 h-[50px] border border-white/30 text-white 
                       font-semibold rounded-[25px] hover:bg-white/10 
                       transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>

        {/* Help Links */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm">
          {[
            { icon: Headphones, label: "Contact Support", href: "/support" },
            { icon: Map, label: "Sitemap", href: "/sitemap" },
            { icon: HelpCircle, label: "Help Center", href: "/help" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-1.5 text-gray-500 hover:text-[#F5C518] transition-colors"
            >
              <item.icon size={14} />
              {item.label}
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-gray-600 text-xs text-center w-full px-4">
        © {new Date().getFullYear()} Cureli. All rights reserved.
      </div>
    </div>
  );
};

export default NotFoundPage;