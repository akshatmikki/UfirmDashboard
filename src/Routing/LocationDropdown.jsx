import React, { useEffect, useMemo, useRef, useState } from "react";

const LocationDropdown = ({
  id,
  disabled = false,
  value,
  options = [],
  placeholder = "Select",
  onChange,
}) => {
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const normalizedOptions = useMemo(
    () =>
      (Array.isArray(options) ? options : [])
        .map((o) => ({
          value: Number(o?.Value ?? o?.value ?? 0) || 0,
          label: (o?.Name ?? o?.label ?? "").toString(),
        }))
        .filter((o) => o.value !== 0 && o.label),
    [options],
  );

  const selected = useMemo(() => {
    const selectedValue = Number(value) || 0;
    return normalizedOptions.find((o) => o.value === selectedValue) || null;
  }, [normalizedOptions, value]);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!open) return;
      const el = rootRef.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const t = setTimeout(() => searchRef.current?.focus?.(), 0);
    return () => clearTimeout(t);
  }, [open]);

  const onToggle = (e) => {
    e.preventDefault();
    if (disabled) return;
    setOpen((s) => !s);
  };

  const onSelect = (nextValue) => {
    if (disabled) return;
    if (typeof onChange === "function") onChange(nextValue);
    setOpen(false);
  };

  const filteredOptions = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter((o) => String(o.label || "").toLowerCase().includes(q));
  }, [normalizedOptions, query]);

  return (
    <div ref={rootRef} className={`ufirm-location-dropdown ${disabled ? "is-disabled" : ""}`}>
      <button
        id={id}
        type="button"
        className="ufirm-location-trigger"
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className="ufirm-location-trigger-text">{selected?.label || placeholder}</span>
        <i className="fas fa-chevron-down ufirm-location-trigger-caret" aria-hidden="true"></i>
      </button>

      {open && (
        <div className="ufirm-location-panel" role="listbox" aria-label={placeholder}>
          <div className="ufirm-location-search">
            <input
              ref={searchRef}
              className="form-control form-control-sm"
              type="text"
              value={query}
              placeholder="Search location..."
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
              disabled={disabled}
            />
          </div>

          {filteredOptions.length === 0 ? (
            <div className="text-muted px-2 py-2" role="note">
              No results
            </div>
          ) : null}

          {filteredOptions.map((o) => {
            const isSelected = Number(o.value) === Number(selected?.value);
            return (
              <button
                key={o.value}
                type="button"
                className={`ufirm-location-item ${isSelected ? "is-selected" : ""}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(o.value)}
              >
                <span className="ufirm-location-dot" aria-hidden="true"></span>
                <span className="ufirm-location-item-text">{o.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LocationDropdown;
