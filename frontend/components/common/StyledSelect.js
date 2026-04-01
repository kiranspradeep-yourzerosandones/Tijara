// components/common/StyledSelect.js
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

const StyledSelect = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => setIsOpen(false);
    const handleResize = () => updatePosition();

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, updatePosition]);

  const selectedOption = options.find((opt) => opt.value === value);
  const isActive = Boolean(value);

  const dropdown = mounted && isOpen && dropdownPosition
    ? createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border border-gray-200 shadow-2xl py-2 
                     animate-in fade-in slide-in-from-top-2 duration-150"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            minWidth: Math.max(dropdownPosition.width, 180),
            borderRadius: 20,
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-sm text-left flex items-center justify-between
                         transition-colors
                         ${value === option.value
                           ? "bg-[#F5C518]/10 text-[#F5C518] font-medium"
                           : "text-gray-700 hover:bg-gray-50"
                         }`}
            >
              <span>{option.label}</span>
              {value === option.value && (
                <Check size={16} className="text-[#F5C518]" />
              )}
            </button>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs text-gray-500 font-medium">{label}</label>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full h-[50px] px-4 border text-sm text-left
                   flex items-center justify-between gap-2 rounded-[25px]
                   focus:outline-none focus:ring-2 focus:ring-[#F5C518]/30 focus:border-[#F5C518]
                   transition-all duration-200 ease-in-out
                   disabled:opacity-50 disabled:cursor-not-allowed
                   ${error
                     ? "border-red-500 bg-red-50"
                     : isActive
                       ? "bg-[#F5C518]/10 border-[#F5C518] text-gray-900 font-medium"
                       : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                   }`}
      >
        <span className={`flex-1 truncate ${selectedOption ? "" : "text-gray-400"}`}>
          {selectedOption?.label || placeholder}
        </span>

        {/* Chevron */}
        <ChevronDown
          size={18}
          className={`flex-shrink-0 transition-transform duration-200
                     ${isOpen ? "rotate-180" : ""}
                     ${isActive ? "text-[#F5C518]" : "text-gray-400"}`}
        />
      </button>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-500 ml-2">{error}</p>
      )}

      {dropdown}
    </div>
  );
};

export default StyledSelect;