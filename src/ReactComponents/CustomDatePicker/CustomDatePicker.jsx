import React, { useState, useEffect, useRef } from "react";
import "./CustomDatePicker.css";

const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const CustomDatePicker = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (value) {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
        setCurrentDate(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleMonthChange = (e) => {
    setCurrentDate(new Date(currentDate.getFullYear(), parseInt(e.target.value), 1));
  };

  const handleYearChange = (e) => {
    setCurrentDate(new Date(parseInt(e.target.value), currentDate.getMonth(), 1));
  };

  const years = [];
  const currentY = new Date().getFullYear();
  for (let i = currentY - 50; i <= currentY + 50; i++) {
    years.push(i);
  }

  const handleDateClick = (e, day) => {
    e.stopPropagation();
    e.preventDefault();
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    
    // Format YYYY-MM-DD
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, "0");
    const dd = String(newDate.getDate()).padStart(2, "0");
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    
    if (onChange) {
      // Simulate event
      onChange({ target: { value: formattedDate } });
    }
    setIsOpen(false);
  };

  const renderDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="custom-datepicker-date disabled"></div>);
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = selectedDate && 
        selectedDate.getDate() === i && 
        selectedDate.getMonth() === month && 
        selectedDate.getFullYear() === year;

      days.push(
        <button
          key={`day-${i}`}
          type="button"
          onClick={(e) => handleDateClick(e, i)}
          className={`custom-datepicker-date ${isSelected ? "selected" : ""}`}
        >
          {i}
        </button>
      );
    }
    return days;
  };

  const formatDateDisplay = (date) => {
    if (!date) return "";
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div className="custom-datepicker-container" ref={containerRef}>
      <div className="custom-datepicker-input-wrapper" onClick={() => setIsOpen(!isOpen)}>
        <input
          type="text"
          className={`custom-datepicker-input form-control ${className || ""}`}
          value={formatDateDisplay(selectedDate) || value || ""}
          readOnly
          placeholder="YYYY-MM-DD"
        />
        <i className="fa fa-calendar custom-datepicker-icon" />
      </div>
      
      {isOpen && (
        <div className="custom-datepicker-popup">
          <div className="custom-datepicker-header">
            <button type="button" onClick={prevMonth}>
               <i className="fa fa-chevron-left" />
            </button>
            <div className="custom-datepicker-month-year" style={{ display: 'flex', gap: '4px' }}>
              <select value={currentDate.getMonth()} onChange={handleMonthChange} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '15px', fontWeight: 500, color: '#333', outline: 'none' }}>
                {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select value={currentDate.getFullYear()} onChange={handleYearChange} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '15px', fontWeight: 500, color: '#333', outline: 'none' }}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button type="button" onClick={nextMonth}>
              <i className="fa fa-chevron-right" />
            </button>
          </div>
          
          <div className="custom-datepicker-grid">
            {daysOfWeek.map(day => (
              <div key={day} className="custom-datepicker-day-name">{day}</div>
            ))}
            {renderDays()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
