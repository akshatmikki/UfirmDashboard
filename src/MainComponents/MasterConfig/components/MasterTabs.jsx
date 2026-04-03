import React from "react";

const tabs = [
  { id: "categories", label: "Categories" },
  { id: "frequencies", label: "Frequencies" },
  { id: "shiftmaster", label: "Shift" },
];

export default function MasterTabs({ tab, onTabChange }) {
  return (
    <div className="mc-tabs">
      {tabs.map((tabItem) => (
        <button
          key={tabItem.id}
          className={`mc-tab ${tab === tabItem.id ? "active" : ""}`}
          type="button"
          onClick={() => onTabChange(tabItem.id)}
        >
          {tabItem.label}
        </button>
      ))}
    </div>
  );
}

