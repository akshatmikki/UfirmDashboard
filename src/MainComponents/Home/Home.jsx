import React, { useEffect, useState, useCallback } from "react";
import { connect, useSelector } from "react-redux";
import { bindActionCreators } from "redux";
import DataProvider from "./DataProvider";
import ChartNavigator from "../Charts/ChartNavigator";
import departmentActions from "../../redux/department/action";
import {
  fetchSubCatTaskCounts,
  fetchAssetServiceRecords,
} from "../../Services/DashboardServices";
import { getAttendance } from "../../Services/AttendanceService";
import { getTaskPriorityCountDash } from "../../Services/TaskPriorityService";
import { getTopDebitExpenses, getTopCreditExpenses, getTop5Expenses } from "../../Services/ExpenseReportService";
import { Link, useHistory } from "react-router-dom";
import { Chart } from "primereact/chart";

const Home = ({ PropertyId }) => {
  const [complains, setComplains] = useState([]);
  const [complainsCnt, setComplainsCnt] = useState(0);
  const history = useHistory();

  const [totalFlats, setTotalFlats] = useState([]);
  const [totalFlatsCnt, setTotalFlatsCnt] = useState(0);

  const [taskStatus, setTaskStatus] = useState([]);
  const [totalTasks, setTotalTasks] = useState(0);

  const [taskPriority, setTaskPriority] = useState([]);
  const [totalActTasks, setTotalActTasks] = useState(0);

  const [assetCount, setAssetCount] = useState([]);
  const [totalAssets, setTotalAssets] = useState(0);

  const [attendance, setAttendance] = useState([]);
  const [attendanceTotal, setAttendanceTotal] = useState(0);

  const [initialDate, setInitialDate] = useState("");
  const [finalDate, setFinalDate] = useState("");
  const filteredAssets = assetCount.filter(a => a.Value > 0);

  const [subCategoryCards] = useState([
    { name: "Lift", id: 4 },
    { name: "DG", id: 69 },
  ]);
  const [subCategoryTaskData, setSubCategoryTaskData] = useState({});

  const [topDebit, setTopDebit] = useState([]);
  const [topCredit, setTopCredit] = useState([]);
  const [topExpenses, setTopExpenses] = useState([]);
  const [dgServiceRecords, setDgServiceRecords] = useState([]);
  const [liftServiceRecords, setLiftServiceRecords] = useState([]);
  const [chartLoading, setChartLoading] = useState({
    tasks: false,
    priority: false,
    assets: false,
    attendance: false,
    expenses: false,
    subCategory: false,
    complains: false,
    dgServices: false,
    liftServices: false,
  });

  const apiProvider = new DataProvider();
  const propertyId = useSelector((state) => state.Commonreducer.puidn);
  const getModel = useCallback(() => {
    return [{ PropertyId: parseInt(PropertyId) }];
  }, [PropertyId]);

  const getExpenseData = useCallback(async (model, initialDate, finalDate) => {
    try {
      const data = await getAllExpenses({
        dateFrom: initialDate,
        dateTo: finalDate,
        officeId: model[0].PropertyId, // mapping officeId with PropertyId
      });

      // API returns array of expenses → group by category
      setExpenses(data);

      // Total calculate karna ho to reduce use karo
      setTotalExpenses(data.reduce((sum, e) => sum + (e.TotalAmount || 0), 0));
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setExpenses([]);
      setTotalExpenses(0);
    }
  }, []);

  const getExpenseChartsData = useCallback(
    async (model, initialDate, finalDate) => {
      try {
        const payload = {
          dateFrom: initialDate,
          dateTo: finalDate,
          officeId: model[0].PropertyId,
        };

        const [debitRes, creditRes, top5Res] = await Promise.all([
          getTopDebitExpenses(payload),
          getTopCreditExpenses(payload),
          getTop5Expenses(payload),
        ]);

        const filteredDebit = debitRes.filter(
          d => d.TotalDebitAmount && d.TotalDebitAmount > 0
        );

        const filteredCredit = creditRes.filter(
          c => c.TotalCreditAmount && c.TotalCreditAmount > 0
        );

        const filteredTop5 = top5Res.filter(
          e => e.Amount && e.Amount !== 0
        );

        setTopDebit(filteredDebit);
        setTopCredit(filteredCredit);
        setTopExpenses(filteredTop5);

      } catch (e) {
        console.error("Expense charts error:", e);
        setTopDebit([]);
        setTopCredit([]);
        setTopExpenses([]);
      }
    },
    []
  );


  const taskStatusCount = useCallback(async (model, initialDate, finalDate) => {
    try {
      const resp = await apiProvider.manageDashTaskStatusCnt(
        model,
        initialDate,
        finalDate
      );
      if (resp && resp.ok && resp.status === 200) {
        const data = await resp.json();
        const defaultCounts = { Actionable: 0, Completed: 0, Pending: 0 };
        let total = 0;

        data.forEach((task) => {
          if (defaultCounts.hasOwnProperty(task.TaskStatus)) {
            defaultCounts[task.TaskStatus] = task.Count;
          }
          total += task.Count;
        });

        setTaskStatus([
          { Title: "Actionable", Value: defaultCounts.Actionable },
          { Title: "Completed", Value: defaultCounts.Completed },
          { Title: "Pending", Value: defaultCounts.Pending },
        ]);
        setTotalTasks(total);
      } else {
        setTaskStatus([
          { Title: "Actionable", Value: 0 },
          { Title: "Completed", Value: 0 },
          { Title: "Pending", Value: 0 },
        ]);
        setTotalTasks(0);
      }
    } catch (error) {
      console.error("Error fetching task status:", error);
    }
  }, []);

  const taskPriorityCount = useCallback(
    async (model, initialDate, finalDate) => {
      try {
        const data = await getTaskPriorityCountDash(
          model[0].PropertyId,
          null, // categoryId
          null, // subCategoryId
          null, // occurance
          null, // status
          null, // priorityId

          initialDate,
          finalDate
        );

        // API se response aata hai jaise:
        // [ { "TaskPriority": "Medium Priority", "Count": 6 } ]
        const prioritiesMap = {
          SOS: 0,
          "High Priority": 0,
          "Medium Priority": 0,
          "Low Priority": 0,
          "On Hold": 0,
        };

        data.forEach((item) => {
          if (prioritiesMap.hasOwnProperty(item.TaskPriority)) {
            prioritiesMap[item.TaskPriority] = item.Count;
          }
        });

        const priorities = [
          { Title: "SOS", Value: prioritiesMap["SOS"] },
          { Title: "High Priority", Value: prioritiesMap["High Priority"] },
          { Title: "Medium Priority", Value: prioritiesMap["Medium Priority"] },
          { Title: "Low Priority", Value: prioritiesMap["Low Priority"] },
          { Title: "On Hold", Value: prioritiesMap["On Hold"] },
        ];

        setTaskPriority(priorities);
        setTotalActTasks(priorities.reduce((sum, p) => sum + p.Value, 0));
      } catch (error) {
        console.error("Error fetching task priority:", error);
        setTaskPriority([
          { Title: "SOS", Value: 0 },
          { Title: "High Priority", Value: 0 },
          { Title: "Medium Priority", Value: 0 },
          { Title: "Low Priority", Value: 0 },
          { Title: "On Hold", Value: 0 },
        ]);
        setTotalActTasks(0);
      }
    },
    []
  );

  const getAssetCount = useCallback(async (model, initialDate, finalDate) => {
    try {
      const resp = await apiProvider.manageDashAssetCardCount(
        model,
        initialDate,
        finalDate
      );
      if (resp && resp.ok && resp.status === 200) {
        const data = await resp.json();
        const assetStatus = [
          { Title: "Total Assets", Value: data.TotalAsset || 0 },
          { Title: "Service Overdue", Value: data.ServiceOverdueAssets || 0 },
          { Title: "Rented-Out Assets", Value: data.RentedOutAsset || 0 },
          { Title: "Checked-Out Assets", Value: data.CheckedOutAssets || 0 },
        ];
        setAssetCount(assetStatus);
        setTotalAssets(data.TotalAsset || 0);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  }, []);

  const getAttendanceData = useCallback(
    async (model, initialDate, finalDate) => {
      try {
        const data = await getAttendance(
          model[0].PropertyId,
          initialDate,
          finalDate
        ); // not 'resp'
        if (!Array.isArray(data)) {
          throw new Error("Attendance data is not an array");
        }

        const presentCount = data.filter(
          (emp) => emp.Status === "Present"
        ).length;
        const absentCount = data.filter(
          (emp) => emp.Status === "Absent"
        ).length;
        const leaveCount = data.filter((emp) => emp.Status === "Leave").length;

        const attendanceStatus = [
          { Title: "Present", Value: presentCount },
          { Title: "Absent", Value: absentCount },
          { Title: "Leave", Value: leaveCount },
        ];

        setAttendance(attendanceStatus);
        setAttendanceTotal(presentCount + absentCount + leaveCount);
      } catch (error) {
        console.error("Error fetching attendance data:", error);

        setAttendance([
          { Title: "Present", Value: 0 },
          { Title: "Absent", Value: 0 },
          { Title: "Leave", Value: 0 },
        ]);
        setAttendanceTotal(0);
      }
    },
    []
  );

  const loadSubCatData = async (propertyId, fromDate, toDate) => {
    const data = await fetchSubCatTaskCounts(propertyId, fromDate, toDate);
    setSubCategoryTaskData(data);
  };

  const loadServiceCategoryData = useCallback(
    async (propertyId, category) => {
      const data = await fetchAssetServiceRecords(
        propertyId,
        null,
        null,
        category
      );

      if (category === "DG") {
        setDgServiceRecords(data);
      } else if (category === "Lift") {
        setLiftServiceRecords(data);
      }
    },
    []
  );

  const withChartLoading = async (key, callback) => {
    setChartLoading((prev) => ({ ...prev, [key]: true }));
    try {
      return await callback();
    } finally {
      setChartLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const getDates = async (initialDate, finalDate) => {
    setInitialDate(initialDate);
    setFinalDate(finalDate);

    const model = getModel();

    try {
      await Promise.all([
        withChartLoading("subCategory", () =>
          loadSubCatData(model[0].PropertyId, initialDate, finalDate)
        ),
        withChartLoading("tasks", () =>
          taskStatusCount(model, initialDate, finalDate)
        ),
        withChartLoading("priority", () =>
          taskPriorityCount(model, initialDate, finalDate)
        ),
        withChartLoading("assets", () =>
          getAssetCount(model, initialDate, finalDate)
        ),
        withChartLoading("attendance", () =>
          getAttendanceData(model, initialDate, finalDate)
        ),
        withChartLoading("expenses", () =>
          getExpenseChartsData(model, initialDate, finalDate)
        ),
        withChartLoading("complains", () => manageDashboardCnt(model)),
        withChartLoading("dgServices", () =>
          loadServiceCategoryData(
            model[0].PropertyId,
            "DG"
          )
        ),
        withChartLoading("liftServices", () =>
          loadServiceCategoryData(
            model[0].PropertyId,
            "Lift"
          )
        ),
      ]);
    } catch (error) {
      console.error("Dashboard refresh error:", error);
    }
  };

  const manageDashboardCnt = useCallback(async (model) => {
    const resp = await apiProvider.manageDashboardCnt(model, "R");
    if (resp && resp.ok && resp.status === 200) {
      const rData = await resp.json();
      if (rData) {
        setTotalFlatsCnt(rData.dashbaordFlatCount.total);
        setTotalFlats([
          { Title: "Owners Residing", Value: rData.dashbaordFlatCount.owner },
          { Title: "Tenants", Value: rData.dashbaordFlatCount.tenant },
          { Title: "Vacant", Value: rData.dashbaordFlatCount.vacant },
          { Title: "Free", Value: rData.dashbaordFlatCount.free },
        ]);
        setComplainsCnt(rData.dashbaordComplainCount.total);
        setComplains([
          { Title: "Open", Value: rData.dashbaordComplainCount.open },
          {
            Title: "In Progress",
            Value: rData.dashbaordComplainCount.inProgress,
          },
          { Title: "Resolved", Value: rData.dashbaordComplainCount.resolved },
          { Title: "Closed", Value: rData.dashbaordComplainCount.completed },
        ]);
      }
    }
  }, []);

  useEffect(() => {
    if (!PropertyId || !initialDate || !finalDate) return;

    const loadOnPropertyChange = async () => {
      const model = getModel();

      try {
        await Promise.all([
          withChartLoading("complains", () => manageDashboardCnt(model)),
          withChartLoading("tasks", () =>
            taskStatusCount(model, initialDate, finalDate)
          ),
          withChartLoading("priority", () =>
            taskPriorityCount(model, initialDate, finalDate)
          ),
          withChartLoading("assets", () =>
            getAssetCount(model, initialDate, finalDate)
          ),
          withChartLoading("attendance", () =>
            getAttendanceData(model, initialDate, finalDate)
          ),
          withChartLoading("expenses", () =>
            getExpenseChartsData(model, initialDate, finalDate)
          ),
          withChartLoading("subCategory", () =>
            loadSubCatData(model[0].PropertyId, initialDate, finalDate)
          ),
          withChartLoading("dgServices", () =>
            loadServiceCategoryData(
              model[0].PropertyId,
              "DG"
            )
          ),
          withChartLoading("liftServices", () =>
            loadServiceCategoryData(
              model[0].PropertyId,
              "Lift"
            )
          ),
        ]);
      } catch (e) {
        console.error(e);
      }
    };

    loadOnPropertyChange();
  }, [PropertyId]);

  useEffect(() => {
    if (!initialDate && !finalDate) {
      ChartNavigator?.props?.onPeriodChange?.("TODAY");
    }
  }, []);

  const hasData = (arr = []) => arr.some((i) => i.Value > 0);
  const NoData = ({ label }) => (
    <div
      className="d-flex align-items-center justify-content-center text-center"
      style={{
        height: "220px",
        fontSize: "18px", // 👈 bigger
        fontWeight: "600", // 👈 bold
        color: "#6c757d", // same muted grey, just explicit
      }}
    >
      No data available for {label}
    </div>
  );

  const hasSubCatData = (id) =>
    subCategoryTaskData[id] &&
    Object.values(subCategoryTaskData[id]).some((v) => v > 0);

  const FIXED_BAR_COUNT = 5;
  const BAR_HEIGHT = 45;

  const getBarChartHeight = () => FIXED_BAR_COUNT * BAR_HEIGHT;
  const buildServiceAnalysis = (records = []) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const metrics = {
      Overdue: 0,
      "Due in 0-30 days": 0,
      "Due in 31-60 days": 0,
      "Due in 61+ days": 0,
    };

    records.forEach((item) => {
      const nextDate = new Date(item.NextServiceDate);
      if (Number.isNaN(nextDate.getTime())) return;
      nextDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays < 0) metrics.Overdue += 1;
      else if (diffDays <= 30) metrics["Due in 0-30 days"] += 1;
      else if (diffDays <= 60) metrics["Due in 31-60 days"] += 1;
      else metrics["Due in 61+ days"] += 1;
    });

    return metrics;
  };

  const dgServiceAnalysis = buildServiceAnalysis(dgServiceRecords);
  const liftServiceAnalysis = buildServiceAnalysis(liftServiceRecords);
  const hasServiceAnalysisData = (analysis = {}) =>
    Object.values(analysis).some((value) => value > 0);
  const CardLoader = () => (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ height: "220px" }}
    >
      <div className="spinner-border text-primary" role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );

  return (
    <>
      <div className="content-wrapper mt-2">
        <section className="content px-2">
          <div className="container-fluid">
            {/* ===== First Row: 4 Cards ===== */}
            <div className="row mt-3">
              {/* 1. Tasks Pie Chart */}
              <div className="col-md-3">
                <div
                  className="card shadow-sm p-3"
                  style={{ minHeight: "300px" }}
                >
                  <h5 className="text-center">Tasks</h5>
                  {chartLoading.tasks ? (
                    <CardLoader />
                  ) : hasData(taskStatus) ? (
                    <Chart
                      type="pie"
                      data={{
                        labels: taskStatus.map(
                          (t) => `${t.Title} (${t.Value})`
                        ),
                        // Link: `/Account/App/PlannerTask?status=${taskStatus.map(t => t.Title)}`,
                        datasets: [
                          {
                            data: taskStatus.map((t) => t.Value),
                            backgroundColor: ["#42A5F5", "#66BB6A", "#EF5350"],
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: "bottom" } },
                        onClick: (e, elements) => {
                          if (elements.length > 0) {
                            const chart = elements[0].element.$context.chart;
                            const index = elements[0].index;
                            const label =
                              chart.data.labels[index].split(" ")[0]; // Extract status from label
                            // Navigate to the desired URL
                            history.push(
                              `/Account/App/PlannerTask?status=${label}&fromDate=${initialDate}&toDate=${finalDate}`
                            );
                          }
                        },
                      }}
                      style={{ width: "100%", height: "220px" }}
                    />
                  ) : (
                    <NoData label="this period" />
                  )}
                </div>
              </div>

              {/* 2. Priority Tasks Table */}
              <div className="col-md-3">
                <Link
                  to="/Account/App/PlannerTask"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    className="card shadow-sm p-3"
                    style={{ minHeight: "300px" }}
                  >
                    <h5 className="text-center">Priority Tasks</h5>
                    {chartLoading.priority ? (
                      <CardLoader />
                    ) : hasData(taskPriority) ? (
                      <div style={{ overflowX: "auto", maxHeight: "220px" }}>
                        <table
                          className="table table-bordered table-striped"
                          style={{ fontSize: "12px" }}
                        >
                          <thead>
                            <tr>
                              <th style={{ padding: "6px" }}>#</th>
                              <th style={{ padding: "6px" }}>Title</th>
                              <th style={{ padding: "6px" }}>Value</th>
                            </tr>
                          </thead>

                          <tbody>
                            {taskPriority.map((p, index) => (
                              <tr key={index}>
                                <td style={{ padding: "6px" }}>{index + 1}</td>
                                <td style={{ padding: "6px" }}>{p.Title}</td>
                                <td style={{ padding: "6px" }}>{p.Value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <NoData label="this period" />
                    )}
                  </div>
                </Link>
              </div>

              {/* 3. Total Assets Bar Chart */}
              <div className="col-md-3">
                <Link
                  to="/Account/App/ServiceRecords"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    className="card shadow-sm p-3"
                    style={{ minHeight: "300px" }}
                  >
                    <h5 className="text-center">Total Assets</h5>
                    {chartLoading.assets ? (
                      <CardLoader />
                    ) : hasData(assetCount) ? (
                     <Chart
                      type="bar"
                      data={{
                        labels: filteredAssets.map((a) => a.Title),
                        datasets: [
                          {
                            label: "Assets",
                            data: filteredAssets.map((a) => a.Value),
                            backgroundColor: [
                              "#42A5F5",
                              "#EF5350",
                              "#FFA726",
                              "#AB47BC",
                            ],
                          },
                        ],
                      }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                        }}
                        style={{ width: "100%", height: "220px" }}
                      />
                    ) : (
                      <NoData label="this period" />
                    )}
                  </div>
                </Link>
              </div>

              {/* 4. Complains Donut Chart */}
              <div className="col-md-3">
                <Link
                  to="/Account/App/TicketComplains"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    className="card shadow-sm p-3"
                    style={{ minHeight: "300px" }}
                  >
                    <h5 className="text-center">Complains</h5>
                    {chartLoading.complains ? (
                      <CardLoader />
                    ) : hasData(complains) ? (
                      <Chart
                        type="doughnut"
                        data={{
                          labels: complains.map(
                            (c) => `${c.Title} (${c.Value})`
                          ),
                          datasets: [
                            {
                              data: complains.map((c) => c.Value),
                              backgroundColor: [
                                "#42A5F5",
                                "#66BB6A",
                                "#FFA726",
                                "#AB47BC",
                              ],
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "bottom",
                            },
                          },
                        }}
                        style={{ width: "100%", height: "220px" }}
                      />
                    ) : (
                      <NoData label="this period" />
                    )}
                  </div>
                </Link>
              </div>
            </div>

            {/* ===== Chart Navigator ===== */}
            <section className="content px-2">
              <div className="container-fluid card p-2 shadow-sm">
                <ChartNavigator onPeriodChange={getDates} />
              </div>
            </section>

            {/* ===== Second Row: 3 Cards ===== */}
            <div className="row mt-3">
              {/* 1. Attendance Donut Chart */}
              <div className="col-md-3">
                <Link
                  to="/Account/App/Attendance"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    className="card shadow-sm p-3"
                    style={{ minHeight: "300px" }}
                  >
                    <h5 className="text-center">Attendance</h5>
                    {chartLoading.attendance ? (
                      <CardLoader />
                    ) : hasData(attendance) ? (
                      <Chart
                        type="doughnut"
                        data={{
                          labels: attendance.map(
                            (a) => `${a.Title} (${a.Value})`
                          ),
                          datasets: [
                            {
                              data: attendance.map((a) => a.Value),
                              backgroundColor: [
                                "#42A5F5",
                                "#EF5350",
                                "#FFCA28",
                              ],
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "bottom",
                            },
                          },
                        }}
                        style={{ width: "100%", height: "220px" }}
                      />
                    ) : (
                      <NoData label="this period" />
                    )}
                  </div>
                </Link>
              </div>

              {/* 2. Top Expenses Bar Chart – Improved UI */}
              <div className="col-md-3">
                <div className="card shadow-sm p-3" style={{ minHeight: "300px" }}>
                  <h5 className="text-center">Top 5 Expenses</h5>

                  {chartLoading.expenses ? (
                    <CardLoader />
                  ) : topExpenses.length > 0 ? (
                    <Chart
                      type="bar"
                      data={{
                        labels: topExpenses.map(e =>
                          e.ExpenseSubType.length > 20
                            ? e.ExpenseSubType.slice(0, 20) + "…"
                            : e.ExpenseSubType
                        ),
                        datasets: [
                          {
                            label: "Amount",
                            data: topExpenses.map(e => Math.abs(e.Amount)), // 👈 important
                            backgroundColor: "#FF7043",

                            barThickness: 18,
                            maxBarThickness: 22,
                            categoryPercentage: 0.6,
                            barPercentage: 0.8,
                          },
                        ],
                      }}
                      options={{
                        indexAxis: "y",
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: ctx => `₹ ${ctx.raw.toLocaleString()}`,
                            },
                          },
                        },
                        scales: {
                          y: {
                            grid: { offset: true },
                            ticks: {
                              padding: 10,
                              font: { size: 11 },
                            },
                          },
                          x: {
                            ticks: {
                              callback: value => `₹ ${value / 1000}K`,
                            },
                          },
                        },
                      }}
                      style={{ height: getBarChartHeight() }}
                    />
                  ) : (
                    <NoData label="this period" />
                  )}
                </div>
              </div>


              {/* 3. Debit Bar Chart – Improved UI */}
              <div className="col-md-3">
                <div className="card shadow-sm p-3" style={{ minHeight: "300px" }}>
                  <h5 className="text-center">Top 5 Debits</h5>

                  {chartLoading.expenses ? (
                    <CardLoader />
                  ) : topDebit.length > 0 ? (
                    <Chart
                      type="bar"
                      data={{
                        labels: topDebit.map(e =>
                          e.ExpenseSubType.length > 20
                            ? e.ExpenseSubType.slice(0, 20) + "…"
                            : e.ExpenseSubType
                        ),
                        datasets: [
                          {
                            label: "Debit Amount",
                            data: topDebit.map(e => e.TotalDebitAmount),
                            backgroundColor: "#EF5350",
                            barThickness: 18,
                            maxBarThickness: 22,
                            categoryPercentage: 0.6,
                            barPercentage: 0.8,
                          },
                        ],
                      }}
                      options={{
                        indexAxis: "y",
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          y: {
                            grid: {
                              offset: true,      // 👈 CRITICAL: adds spacing between rows
                            },
                            ticks: {
                              padding: 10,       // 👈 space between label text and bar
                              font: {
                                size: 11,
                              },
                            },
                          },
                          x: {
                            ticks: {
                              autoSkip: true,
                            },
                          },
                        },
                      }}

                      style={{ height: getBarChartHeight() }}
                    />
                  ) : (
                    <NoData label="this period" />
                  )}
                </div>
              </div>

              {/* 4. Credit Bar Chart – Improved UI */}
              <div className="col-md-3">
                <div className="card shadow-sm p-3" style={{ minHeight: "300px" }}>
                  <h5 className="text-center">Top 5 Credits</h5>

                  {chartLoading.expenses ? (
                    <CardLoader />
                  ) : topCredit.length > 0 ? (
                    <Chart
                      type="bar"
                      data={{
                        labels: topCredit.map(e =>
                          e.ExpenseSubType.length > 20
                            ? e.ExpenseSubType.slice(0, 20) + "…"
                            : e.ExpenseSubType
                        ),
                        datasets: [
                          {
                            label: "Credit Amount",
                            data: topCredit.map(e => e.TotalCreditAmount),
                            backgroundColor: "#66BB6A",
                            barThickness: 18,
                            maxBarThickness: 22,
                            categoryPercentage: 0.6,
                            barPercentage: 0.8,
                          },
                        ],
                      }}
                      options={{
                        indexAxis: "y",
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          y: {
                            grid: {
                              offset: true,      // 👈 CRITICAL: adds spacing between rows
                            },
                            ticks: {
                              padding: 10,       // 👈 space between label text and bar
                              font: {
                                size: 11,
                              },
                            },
                          },
                          x: {
                            ticks: {
                              autoSkip: true,
                            },
                          },
                        },
                      }}

                      style={{ height: getBarChartHeight() }}
                    />
                  ) : (
                    <NoData label="this period" />
                  )}
                </div>
              </div>

              {/* 5. Lift Line Chart */}
              <div className="col-md-3">
                <div
                  className="card shadow-sm p-3"
                  style={{ minHeight: "300px" }}
                >
                  <h5 className="text-center">Lift</h5>
                  <Link
                    to="/Account/App/PlannerTask"
                    style={{ textDecoration: "none" }}
                  >
                    {chartLoading.subCategory ? (
                      <CardLoader />
                    ) : hasSubCatData(4) ? (
                      <Chart
                        type="line"
                        data={{
                          labels: ["Actionable", "Completed", "Pending"],
                          datasets: [
                            {
                              label: "Lift Tasks",
                              data: [
                                subCategoryTaskData[4]
                                  ? subCategoryTaskData[4].Actionable || 0
                                  : 0,
                                subCategoryTaskData[4]
                                  ? subCategoryTaskData[4].Completed || 0
                                  : 0,
                                subCategoryTaskData[4]
                                  ? subCategoryTaskData[4].Pending || 0
                                  : 0,
                              ],
                              fill: false,
                              borderColor: "#42A5F5",
                              tension: 0.4,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { beginAtZero: true, ticks: { stepSize: 1 } },
                          },
                        }}
                        style={{ width: "100%", height: "220px" }}
                      />
                    ) : (
                      <NoData label="this period" />
                    )}
                  </Link>
                </div>
              </div>

              {/* 6. DG Line Chart */}
              <div className="col-md-3">
                <div
                  className="card shadow-sm p-3"
                  style={{ minHeight: "300px" }}
                >
                  <h5 className="text-center">DG</h5>
                  <Link
                    to="/Account/App/PlannerTask"
                    style={{ textDecoration: "none" }}
                  >
                    {chartLoading.subCategory ? (
                      <CardLoader />
                    ) : hasSubCatData(69) ? (
                      <Chart
                        type="line"
                        data={{
                          labels: ["Actionable", "Completed", "Pending"],
                          datasets: [
                            {
                              label: "DG Tasks",
                              data: [
                                subCategoryTaskData[69]
                                  ? subCategoryTaskData[69].Actionable || 0
                                  : 0,
                                subCategoryTaskData[69]
                                  ? subCategoryTaskData[69].Completed || 0
                                  : 0,
                                subCategoryTaskData[69]
                                  ? subCategoryTaskData[69].Pending || 0
                                  : 0,
                              ],
                              fill: false,
                              borderColor: "#EF5350",
                              tension: 0.4,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { beginAtZero: true, ticks: { stepSize: 1 } },
                          },
                        }}
                        style={{ width: "100%", height: "220px" }}
                      />
                    ) : (
                      <NoData label="this period" />
                    )}
                  </Link>
                </div>
              </div>

              {/* 7. DG Service Analysis */}
              <div className="col-md-3">
                <Link
                  to="/Account/App/ServiceRecords"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="card shadow-sm p-3" style={{ minHeight: "300px" }}>
                    <h5 className="text-center">DG Service Analysis</h5>
                    {chartLoading.dgServices ? (
                      <CardLoader />
                    ) : hasServiceAnalysisData(dgServiceAnalysis) ? (
                      <Chart
                        type="bar"
                        data={{
                          labels: Object.keys(dgServiceAnalysis),
                          datasets: [
                            {
                              label: `DG Assets (${dgServiceRecords.length})`,
                              data: Object.values(dgServiceAnalysis),
                              backgroundColor: ["#E53935", "#FB8C00", "#FDD835", "#43A047"],
                            },
                          ],
                        }}
                        options={{
                          indexAxis: "y",
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            x: {
                              beginAtZero: true,
                              ticks: { stepSize: 1 },
                            },
                          },
                        }}
                        style={{ width: "100%", height: "220px" }}
                      />
                    ) : (
                      <NoData label="DG services" />
                    )}
                  </div>
                </Link>
              </div>

              {/* 8. Lift Service Analysis */}
              <div className="col-md-3">
                <Link
                  to="/Account/App/ServiceRecords"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="card shadow-sm p-3" style={{ minHeight: "300px" }}>
                    <h5 className="text-center">Lift Service Analysis</h5>
                    {chartLoading.liftServices ? (
                      <CardLoader />
                    ) : hasServiceAnalysisData(liftServiceAnalysis) ? (
                      <Chart
                        type="bar"
                        data={{
                          labels: Object.keys(liftServiceAnalysis),
                          datasets: [
                            {
                              label: `Lift Assets (${liftServiceRecords.length})`,
                              data: Object.values(liftServiceAnalysis),
                              backgroundColor: ["#5E35B1", "#1E88E5", "#26A69A", "#7CB342"],
                            },
                          ],
                        }}
                        options={{
                          indexAxis: "y",
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            x: {
                              beginAtZero: true,
                              ticks: { stepSize: 1 },
                            },
                          },
                        }}
                        style={{ width: "100%", height: "220px" }}
                      />
                    ) : (
                      <NoData label="Lift services" />
                    )}
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

const mapStoreToProps = (state) => ({
  PropertyId: state.Commonreducer.puidn,
  Entrolval: state.Commonreducer.entrolval,
  dashDates: state.Commonreducer.dashDates,
});

const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators(departmentActions, dispatch),
});

export default connect(mapStoreToProps, mapDispatchToProps)(Home);

