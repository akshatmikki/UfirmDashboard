import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { useSelector } from "react-redux";
import {
  getTaskSummary,
  getTaskDetails,
  getTaskMonthlySummary,
} from "../Services/PPMSpreadsheet";
import "../Style/PPMSpreadsheet.css";

export default function PPMCalendar() {
  const propertyId = useSelector((s) => s.Commonreducer.puidn);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarFilter, setCalendarFilter] = useState("total"); // total | completed | pending | actionable
  const [summaryByDate, setSummaryByDate] = useState({});
  const [monthlySummary, setMonthlySummary] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    actionableTasks: 0,
  });
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogData, setDialogData] = useState({
    memberName: "",
    tasksByName: {},
  });

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  useEffect(() => {
    if (!propertyId) return;

    const fetchSummary = async () => {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      const [dailyData, monthlyData] = await Promise.all([
        getTaskSummary(propertyId, month, year),
        getTaskMonthlySummary(propertyId, month, year),
      ]);

      const grouped = {};
      dailyData.forEach((item) => {
        const dateKey = item.TaskDate?.slice(0, 10);
        if (!dateKey) return;
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(item);
      });

      const totals = monthlyData.reduce(
        (acc, item) => ({
          totalTasks: acc.totalTasks + (item.TotalTasks || 0),
          completedTasks: acc.completedTasks + (item.CompletedTasks || 0),
          pendingTasks: acc.pendingTasks + (item.PendingTasks || 0),
          actionableTasks: acc.actionableTasks + (item.ActionableTasks || 0),
        }),
        { totalTasks: 0, completedTasks: 0, pendingTasks: 0, actionableTasks: 0 }
      );

      setSummaryByDate(grouped);
      setMonthlySummary(totals);
    };

    fetchSummary();
  }, [propertyId, currentDate]);

  const getDaysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date) => {
    const jsDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return (jsDay + 6) % 7;
  };

  const generateCalendarDays = () => {
    const days = [];
    const firstDay = getFirstDayOfMonth(currentDate);
    const total = getDaysInMonth(currentDate);

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= total; i++) days.push(i);

    return days;
  };

  const normalizeStatus = (value) => String(value || "").trim().toLowerCase();

  const getMemberStatusCount = (member, filterKey) => {
    if (!member) return 0;
    const key = normalizeStatus(filterKey);
    if (key === "pending") return Number(member.PendingTaskCount || 0);
    if (key === "actionable") return Number(member.ActionableTaskCount || member.ActionableCount || 0);
    // For "total" and "completed", show completed count in green as requested
    const total = Number(member.TaskCount ?? member.TotalTaskCount ?? 0);
    const pending = Number(member.PendingTaskCount ?? 0);
    if (Number.isFinite(total) && Number.isFinite(pending) && total > 0) {
      return Math.max(0, total - pending);
    }
    return Number(member.CompletedTaskCount || member.CompletedCount || 0);
  };

  const getCountClass = (filterKey) => {
    const key = normalizeStatus(filterKey);
    if (key === "pending") return "ppm-count-pending";
    if (key === "actionable") return "ppm-count-actionable";
    return "ppm-count-completed";
  };

  const handleMemberClick = async (member, dateKey) => {
    const taskIds = (member.TaskIds || "").split(",").filter(Boolean);
    const taskMap = {};
    const filterKey = normalizeStatus(calendarFilter);

    const matchesDialogFilter = (row) => {
      if (filterKey === "total") return true;
      const status = normalizeStatus(row?.Action || row?.Status || row?.TaskStatus);
      if (!status) return false;
      if (filterKey === "completed") return status.includes("complete");
      if (filterKey === "pending") return status.includes("pending");
      if (filterKey === "actionable") return status.includes("actionable");
      return true;
    };

    for (const taskId of taskIds) {
      const details = await getTaskDetails(taskId, dateKey, member.FacilityMemberId);
      const filteredDetails = (details || []).filter(matchesDialogFilter);

      filteredDetails.forEach((d) => {
        if (!taskMap[d.TaskName]) taskMap[d.TaskName] = [];
        taskMap[d.TaskName].push(d);
      });
    }

    setDialogData({
      memberName: member.FacilityMemberName,
      tasksByName: taskMap,
    });

    setDialogVisible(true);
  };

  const getStatusColor = (status) => {
    if (!status) return "";
    if (status.toLowerCase() === "pending") return "text-danger";
    if (status.toLowerCase() === "completed") return "text-success";
    return "text-warning";
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="content-wrapper ppm-wrapper">
      <div className="card ppm-card">
        <div className="card-header ppm-header">
          <div className="ppm-filters">
            <select
              className="form-select ppm-select"
              value={currentDate.getMonth()}
              onChange={(e) =>
                setCurrentDate(new Date(currentDate.getFullYear(), +e.target.value, 1))
              }
            >
              {monthNames.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>

            <select
              className="form-select ppm-select ppm-select-year"
              value={currentDate.getFullYear()}
              onChange={(e) => setCurrentDate(new Date(+e.target.value, currentDate.getMonth(), 1))}
            >
              {Array.from({ length: 8 }, (_, i) => 2024 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="ppm-summary-row">
            <button
              type="button"
              className={`ppm-stat-card ppm-stat-total ${calendarFilter === "total" ? "ppm-stat-active" : ""}`}
              onClick={() => setCalendarFilter("total")}
              title="Show all tasks (cards show completed/total)"
            >
              <div className="ppm-stat-value">{monthlySummary.totalTasks}</div>
              <div className="ppm-stat-label">Total Tasks</div>
            </button>
            <button
              type="button"
              className={`ppm-stat-card ppm-stat-completed ${calendarFilter === "completed" ? "ppm-stat-active" : ""}`}
              onClick={() => setCalendarFilter("completed")}
              title="Filter calendar by completed"
            >
              <div className="ppm-stat-value">{monthlySummary.completedTasks}</div>
              <div className="ppm-stat-label">Completed</div>
            </button>
            <button
              type="button"
              className={`ppm-stat-card ppm-stat-pending ${calendarFilter === "pending" ? "ppm-stat-active" : ""}`}
              onClick={() => setCalendarFilter("pending")}
              title="Filter calendar by pending"
            >
              <div className="ppm-stat-value">{monthlySummary.pendingTasks}</div>
              <div className="ppm-stat-label">Pending</div>
            </button>
            <button
              type="button"
              className={`ppm-stat-card ppm-stat-actionable ${calendarFilter === "actionable" ? "ppm-stat-active" : ""}`}
              onClick={() => setCalendarFilter("actionable")}
              title="Filter calendar by actionable"
            >
              <div className="ppm-stat-value">{monthlySummary.actionableTasks}</div>
              <div className="ppm-stat-label">Actionable</div>
            </button>
          </div>
        </div>

        <div className="card-body p-0">
          <table className="table table-bordered mb-0 ppm-calendar-table">
            <thead>
              <tr>
                {dayNames.map((d) => (
                  <th key={d} className="text-center">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, w) => (
                <tr key={w}>
                  {Array.from({ length: 7 }).map((_, d) => {
                    const day = calendarDays[w * 7 + d];
                    const dateKey = day
                      ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                      : null;

                    const members = dateKey ? summaryByDate[dateKey] : null;
                    const filteredMembers = (members || []).filter((m) => {
                      const filterKey = normalizeStatus(calendarFilter);
                      if (filterKey === "total") return true;
                      return getMemberStatusCount(m, filterKey) > 0;
                    });

                    return (
                      <td key={d} className="ppm-day-cell">
                        {day && (
                          <>
                            <div className="ppm-day-number">{day}</div>

                            <div className="ppm-member-list">
                              {filteredMembers?.map((m, i) => (
                                <div
                                  key={i}
                                  onClick={() => handleMemberClick(m, dateKey)}
                                  className="ppm-member-card"
                                >
                                  <span className="ppm-member-name">
                                    {(m.FacilityMemberName || "").trim()}
                                  </span>
                                  <span className="ppm-count-wrap">
                                    <span className={getCountClass(calendarFilter)}>
                                      {getMemberStatusCount(m, calendarFilter)}
                                    </span>
                                    <span className="ppm-count-sep">/</span>
                                    <span className="ppm-count-total">{m.TaskCount || 0}</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        header="Task Details"
        visible={dialogVisible}
        style={{ width: "75vw" }}
        modal
        onHide={() => setDialogVisible(false)}
      >
        <h5>Facility Member: {dialogData.memberName}</h5>

        {Object.entries(dialogData.tasksByName).map(([taskName, rows], idx) => (
          <div key={idx} style={{ marginBottom: 24 }}>
            <h6>Task Name: {taskName}</h6>

            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Remarks</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.QuestionName}</td>
                    <td>{r.Remarks || "-"}</td>
                    <td className={getStatusColor(r.Action)}>{r.Action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </Dialog>
    </div>
  );
}
