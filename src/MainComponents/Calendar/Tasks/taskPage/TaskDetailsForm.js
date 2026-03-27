import React from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { setHours, setMinutes } from "date-fns";
import { TaskField } from "./TaskPageLayout";

function isValidDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export default function TaskDetailsForm({
  readOnly = false,
  showTaskId,
  taskId,
  taskName,
  onTaskNameChange,
  propertyId,
  propertyOptions,
  location,
  onLocationChange,
  categoryOptions,
  selectedCategory,
  onCategoryChange,
  subCategoryOptions,
  selectedSubCategory,
  onSubCategoryChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  check,
  onAllDayChange,
  allDayDisabled,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  remindme,
  onRemindMeChange,
  assignOptions,
  assignTo,
  onAssignToChange,
  occurrenceOptions,
  occurence,
  onOccurenceChange,
  assignToText,
  occurrenceText,
}) {
  const startDateIsDate = isValidDate(startDate);
  const endDateIsDate = isValidDate(endDate);
  const startTimeIsDate = isValidDate(startTime);
  const endTimeIsDate = isValidDate(endTime);
  const propertyLabel =
    (propertyOptions || []).find((p) => String(p.propertyId) === String(propertyId))?.name ||
    propertyId ||
    "";
  const categoryLabel =
    (categoryOptions || []).find(
      (c) => String(c.Id ?? c.catId) === String(selectedCategory),
    )?.Name ||
    (categoryOptions || []).find(
      (c) => String(c.Id ?? c.catId) === String(selectedCategory),
    )?.name ||
    selectedCategory ||
    "";
  const subCategoryLabel =
    (subCategoryOptions || []).find(
      (s) => String(s.SubCategoryId) === String(selectedSubCategory),
    )?.SubCategoryName ||
    selectedSubCategory ||
    "";

  return (
    <div className="add-task-form task-details-grid">
      {showTaskId ? (
        <TaskField label="Task Id">
          <input className="form-control" value={taskId || ""} disabled />
        </TaskField>
      ) : null}

      <TaskField label="Task Name">
        {readOnly ? (
          <input className="form-control" value={taskName || ""} disabled />
        ) : (
          <input
            className="form-control"
            value={taskName || ""}
            placeholder="Enter Task Name"
            onChange={(e) => onTaskNameChange?.(e.target.value)}
          />
        )}
      </TaskField>

      <TaskField label="Property">
        {readOnly ? (
          <input className="form-control" value={propertyLabel} disabled />
        ) : (
          <select className="form-control" value={propertyId || ""} disabled>
            <option value="">Select Property</option>
            {(propertyOptions || []).map((p) => (
              <option key={String(p.propertyId)} value={p.propertyId}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </TaskField>

      <TaskField label="Location">
        {readOnly ? (
          <input className="form-control" value={location || ""} disabled />
        ) : (
          <input
            className="form-control"
            value={location || ""}
            placeholder="Enter Location"
            onChange={(e) => onLocationChange?.(e.target.value)}
          />
        )}
      </TaskField>

      <TaskField label="Category">
        {readOnly ? (
          <input className="form-control" value={categoryLabel} disabled />
        ) : (
          <select
            className={`form-control ${!selectedCategory ? "placeholder-select" : ""}`}
            value={selectedCategory || ""}
            onChange={(e) => onCategoryChange?.(e.target.value)}
          >
            <option value="">Select Category</option>
            {(categoryOptions || []).map((c) => (
              <option key={String(c.Id ?? c.catId)} value={c.Id ?? c.catId}>
                {c.Name ?? c.name}
              </option>
            ))}
          </select>
        )}
      </TaskField>

      <TaskField label="Sub Category">
        {readOnly ? (
          <input className="form-control" value={subCategoryLabel} disabled />
        ) : (
          <select
            className={`form-control ${!selectedSubCategory ? "placeholder-select" : ""}`}
            value={selectedSubCategory || ""}
            onChange={(e) => onSubCategoryChange?.(e.target.value)}
          >
            <option value="">Select Sub Category</option>
            {(subCategoryOptions || []).map((s) => (
              <option key={String(s.SubCategoryId)} value={s.SubCategoryId}>
                {s.SubCategoryName}
              </option>
            ))}
          </select>
        )}
      </TaskField>

      <TaskField label="Start Date">
        {readOnly ? (
          <input
            className="form-control"
            value={startDateIsDate ? startDate.toLocaleDateString() : startDate || ""}
            disabled
          />
        ) : (
          <ReactDatePicker
            className="form-control"
            selected={startDateIsDate ? startDate : new Date()}
            dateFormat="dd/MM/yyyy"
            onChange={(d) => onStartDateChange?.(d)}
          />
        )}
      </TaskField>

      <TaskField label="End Date">
        {readOnly ? (
          <input
            className="form-control"
            value={endDateIsDate ? endDate.toLocaleDateString() : endDate || ""}
            disabled
          />
        ) : (
          <ReactDatePicker
            className="form-control"
            selected={endDateIsDate ? endDate : new Date()}
            dateFormat="dd/MM/yyyy"
            onChange={(d) => onEndDateChange?.(d)}
          />
        )}
      </TaskField>

      <TaskField label="All Day" className="task-field--switch">
        <label className="switch">
          <input
            type="checkbox"
            checked={!!check}
            disabled={readOnly || allDayDisabled}
            onChange={(e) => onAllDayChange?.(e.target.checked)}
          />
          <span className="slider round" />
        </label>
      </TaskField>

      <TaskField label="Start Time">
        {readOnly ? (
          <input
            className="form-control"
            value={startTimeIsDate ? startTime.toLocaleTimeString() : startTime || ""}
            disabled
          />
        ) : (
          <ReactDatePicker
            className="form-control"
            selected={startTimeIsDate ? startTime : new Date()}
            onChange={(d) => onStartTimeChange?.(d)}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={15}
            timeCaption="Time"
            dateFormat="h:mm aa"
            minTime={setHours(setMinutes(new Date(), 0), 0)}
            maxTime={setHours(setMinutes(new Date(), 45), 23)}
          />
        )}
      </TaskField>

      <TaskField label="End Time">
        {readOnly ? (
          <input
            className="form-control"
            value={endTimeIsDate ? endTime.toLocaleTimeString() : endTime || ""}
            disabled
          />
        ) : (
          <ReactDatePicker
            className="form-control"
            selected={endTimeIsDate ? endTime : new Date()}
            onChange={(d) => onEndTimeChange?.(d)}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={15}
            timeCaption="Time"
            dateFormat="h:mm aa"
            minTime={setHours(setMinutes(new Date(), 0), 0)}
            maxTime={setHours(setMinutes(new Date(), 45), 23)}
          />
        )}
      </TaskField>

      <TaskField label="Remind Me">
        {readOnly ? (
          <input className="form-control" value={remindme || ""} disabled />
        ) : (
          <input
            className="form-control"
            value={remindme || ""}
            placeholder="Enter reminder"
            onChange={(e) => onRemindMeChange?.(e.target.value)}
          />
        )}
      </TaskField>

      <TaskField label="Assign To">
        {readOnly ? (
          <input className="form-control" value={assignToText || ""} disabled />
        ) : (
          <select
            className={`form-control ${!assignTo ? "placeholder-select" : ""}`}
            value={assignTo || ""}
            onChange={(e) => onAssignToChange?.(e.target.value)}
          >
            <option value="">Select Assign</option>
            {(assignOptions || []).map((a) => (
              <option key={String(a.assignId)} value={a.assignId}>
                {a.assignName}
              </option>
            ))}
          </select>
        )}
      </TaskField>

      <TaskField label="Occurrence">
        {readOnly ? (
          <input className="form-control" value={occurrenceText || ""} disabled />
        ) : (
          <select
            className={`form-control ${!occurence ? "placeholder-select" : ""}`}
            value={occurence || ""}
            onChange={(e) => onOccurenceChange?.(e.target.value)}
          >
            <option value="">Select Occurrence</option>
            {(occurrenceOptions || []).map((o) => (
              <option key={String(o.value)} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </TaskField>
    </div>
  );
}
