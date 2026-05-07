import React, { useState, useEffect, useRef } from "react";
import "./CustomDropdown.css";

const CustomDropdown = ({ options = [], value, onChange, placeholder = "Select...", variant = "long", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (e, optValue) => {
    e.stopPropagation();
    e.preventDefault();
    if (onChange) {
      onChange({ target: { value: optValue } });
    }
    setIsOpen(false);
  };

  // Convert array of strings or array of objects to standard object array
  const formattedOptions = options.map(opt => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { label: String(opt), value: String(opt) };
    }
    return opt;
  });

  const selectedOption = formattedOptions.find(opt => String(opt.value) === String(value));

  return (
    <div className={`custom-dropdown-container ${variant} ${isOpen ? "is-open" : ""} ${className}`.trim()} ref={containerRef}>
      <div className="custom-dropdown-input form-control" onClick={() => setIsOpen(!isOpen)}>
        {selectedOption ? (
           <span className="custom-dropdown-value">{selectedOption.label}</span>
        ) : (
           <span className="custom-dropdown-input-placeholder">{placeholder}</span>
        )}
        <i className={`fa ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
      </div>
      
      {isOpen && (
        <div className="custom-dropdown-menu">
          {formattedOptions.length === 0 ? (
            <div className="custom-dropdown-item" style={{ color: '#aaa', cursor: 'default' }}>No options</div>
          ) : (
            formattedOptions.map((opt, index) => (
              <div 
                key={index} 
                className={`custom-dropdown-item ${String(opt.value) === String(value) ? 'selected' : ''}`}
                onClick={(e) => handleSelect(e, opt.value)}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
