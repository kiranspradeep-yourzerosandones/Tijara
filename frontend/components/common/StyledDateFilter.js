// components/common/StyledDateFilter.js
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const StyledDateFilter = ({ label, date, setDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
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
      });
    }
  }, []);

  const handleToggle = () => {
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

  const daysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const formatDateDisplay = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const offset = newDate.getTimezoneOffset();
    const adjustedDate = new Date(newDate.getTime() - offset * 60 * 1000);
    const dateString = adjustedDate.toISOString().split("T")[0];
    setDate(dateString);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setDate("");
    setIsOpen(false);
  };

  const changeMonth = (offset) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const renderCalendar = () => {
    const totalDays = daysInMonth(currentMonth);
    const startDay = firstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9" />);
    }

    for (let i = 1; i <= totalDays; i++) {
      const tempDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const isSelected =
        date &&
        parseInt(date.split("-")[2]) === i &&
        parseInt(date.split("-")[1]) === currentMonth.getMonth() + 1 &&
        parseInt(date.split("-")[0]) === currentMonth.getFullYear();
      const isToday = new Date().toDateString() === tempDate.toDateString();

      days.push(
        <button
          key={i}
          onClick={() => handleDateClick(i)}
          className={`
            h-9 w-9 rounded-full text-sm font-medium flex items-center justify-center transition-all
            ${isSelected
              ? "bg-[#F5C518] text-black shadow-md scale-105"
              : "text-gray-700 hover:bg-[#F5C518]/20 hover:text-[#F5C518]"
            }
            ${!isSelected && isToday ? "border-2 border-[#F5C518] text-[#F5C518] font-bold" : ""}
          `}
        >
          {i}
        </button>
      );
    }
    return days;
  };

  const isActive = Boolean(date);

  const dropdown = mounted && isOpen && dropdownPosition
    ? createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] p-4 w-72 bg-white border border-gray-200 shadow-2xl animate-in fade-in slide-in-from-top-2"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            borderRadius: 20,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-gray-800">
              {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 mb-2 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <span key={day} className="text-xs font-medium text-gray-400">
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-y-1 justify-items-center">
            {renderCalendar()}
          </div>

          {/* Today Button */}
          <button
            onClick={() => {
              const today = new Date();
              setCurrentMonth(today);
              handleDateClick(today.getDate());
            }}
            className="w-full mt-4 py-2 text-sm font-medium text-[#F5C518] hover:bg-[#F5C518]/10 
                       rounded-xl transition-colors"
          >
            Today
          </button>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs text-gray-500 font-medium ml-1">{label}</label>
      )}

      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggle}
          className={`
            h-[50px] pl-12 pr-10 border text-sm text-left 
            flex items-center w-auto min-w-[180px] whitespace-nowrap
            focus:outline-none focus:ring-2 focus:ring-[#F5C518]/30 focus:border-[#F5C518]
            transition-all duration-200 ease-in-out rounded-[25px]
            ${isActive
              ? "bg-[#F5C518]/10 border-[#F5C518] text-gray-900 font-medium"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }
          `}
        >
          <CalendarIcon
            size={18}
            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors
              ${isActive ? "text-[#F5C518]" : "text-gray-400"}`}
          />
          <span>{isActive ? formatDateDisplay(date) : "Select Date"}</span>
          {isActive ? (
            <div
              role="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full 
                         hover:bg-[#F5C518]/20 text-[#F5C518] transition-colors z-10"
            >
              <X size={14} strokeWidth={2.5} />
            </div>
          ) : (
            <ChevronDown
              size={16}
              className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200
                ${isOpen ? "rotate-180" : ""}`}
            />
          )}
        </button>
      </div>

      {dropdown}
    </div>
  );
};

export default StyledDateFilter;