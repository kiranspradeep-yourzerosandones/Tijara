// components/common/StyledSearch.js
"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";

const StyledSearch = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  loading = false,
  disabled = false,
  autoFocus = false,
  className = "",
}) => {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(value);
    }
    if (e.key === "Escape") {
      handleClear();
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const isActive = value.length > 0;

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          relative flex items-center h-[50px] rounded-[25px] border
          transition-all duration-200 ease-in-out overflow-hidden
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${isFocused
            ? "border-[#F5C518] bg-[#F5C518]/5 ring-2 ring-[#F5C518]/20"
            : isActive
              ? "border-[#F5C518]/50 bg-[#F5C518]/5"
              : "border-gray-200 bg-white hover:border-gray-300"
          }
        `}
      >
        {/* Search Icon */}
        <div className="absolute left-4 flex items-center justify-center">
          {loading ? (
            <Loader2
              size={20}
              className="text-[#F5C518] animate-spin"
            />
          ) : (
            <Search
              size={20}
              className={`transition-colors duration-200 ${
                isFocused || isActive ? "text-[#F5C518]" : "text-gray-400"
              }`}
            />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-full pl-12 pr-12 bg-transparent text-sm text-gray-900
                     placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed"
        />

        {/* Clear Button */}
        {isActive && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1.5 rounded-full bg-gray-100 
                       hover:bg-[#F5C518]/20 text-gray-500 hover:text-[#F5C518]
                       transition-all duration-200"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        )}

        {/* Search Button (Optional - shows when focused with text) */}
        {isFocused && isActive && onSearch && (
          <button
            type="button"
            onClick={() => onSearch(value)}
            className="absolute right-3 px-4 py-1.5 rounded-full bg-[#F5C518] 
                       text-black text-xs font-semibold hover:bg-[#d4a815]
                       transition-all duration-200 shadow-sm"
          >
            Search
          </button>
        )}
      </div>
    </div>
  );
};

export default StyledSearch;