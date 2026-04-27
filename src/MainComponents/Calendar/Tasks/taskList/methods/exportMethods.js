import { downloadExcel } from "react-export-table-to-excel";
import moment from "moment";
import * as appCommon from "../../../../../Common/AppCommon.js";

export default function attachExportMethods(TaskList) {
  const EXPORT_CONCURRENCY = 6;

  TaskList.prototype.toggleDateGroup = function (date) {
    this.setState((prevState) => ({
      expandedDate: prevState.expandedDate === date ? null : date,
      cardPage: 1,
      tablePage: 1,
    }));
  };

  TaskList.prototype.getExportDataWithQuestions = function () {
    const exportRows = [];

    this.state.data.forEach((task) => {
      const questions = task.TaskTransactionModel1 || [];

      if (!questions.length) {
        exportRows.push({ ...task, Questionnaire: "" });
      } else {
        questions.forEach((q) => {
          exportRows.push({
            ...task,
            Questionnaire: q.Question || q.QuestionName || "",
          });
        });
      }
    });

    return exportRows;
  };

  TaskList.prototype.fetchQuestionsForTask = async function (task) {
    try {
      const taskId = task.TaskId;
      const rawDate = task?.UpdatedOn || task?.DateFrom || "";

      // Explicitly specify DD-MM-YYYY first since state stores dates like "24-04-2026"
      const dateMoment = moment(rawDate, ["DD-MM-YYYY", "YYYY-MM-DD", "DD/MM/YYYY", moment.ISO_8601]);
      const updatedOn = dateMoment.isValid() ? dateMoment.format("YYYY-MM-DD") : null;

      if (!taskId || !updatedOn) {
        console.warn("[fetchQuestionsForTask] Skipping task", taskId, "- invalid date:", rawDate, "→ updatedOn:", updatedOn);
        return [];
      }

      const model = [{ CmdType: "R", Id: taskId, date: updatedOn }];
      const resp = await this.ApiProvider.manageQues(model, "R");

      if (resp.ok && resp.status === 200) {
        const rData = await resp.json();
        return rData.map((q) => ({
          QuesId: q.QuestID,
          QuesName: q.QuestionName,
          Action: q.Action,
          Remark: q.Remarks,
        }));
      }

      return [];
    } catch (e) {
      console.error("Question fetch failed for task", task.TaskId, e);
      return [];
    }
  };

  TaskList.prototype.handleCustomPropertyExport = async function () {
    // Custom multi-sheet export: one tab per Supervisor, grouped by Task Name
    // Columns: Location | Q1 | Q2 | ... | Remarks
    // ✔ = completed/done, ✘ = otherwise
    const XLSX = await import("xlsx");

    if (this.state.exporting) return;
    this.setState({ exporting: true });

    try {
      // 1. Fetch questions for all visible tasks
      const tasksWithQues = [];
      for (const task of this.state.data) {
        const questions = await this.fetchQuestionsForTask(task);
        tasksWithQues.push({ ...task, questionsList: questions || [] });
      }

      // 2. Group by Supervisor
      const supervisorGroups = {};
      tasksWithQues.forEach((t) => {
        const sup = t.AssignedTo || "Unassigned";
        if (!supervisorGroups[sup]) supervisorGroups[sup] = [];
        supervisorGroups[sup].push(t);
      });

      const wb = XLSX.utils.book_new();

      Object.keys(supervisorGroups).forEach((supervisorName) => {
        const supTasks = supervisorGroups[supervisorName];
        let sheetData = [];

        // Group by Task Name within supervisor (ignore case and internal whitespace)
        const taskNameGroups = {};
        const taskDisplayNameMap = {}; // key -> UPPERCASE_NAME

        supTasks.forEach((t) => {
          const rawName = t.Name || "Unnamed Task";
          const normalizedKey = rawName.toLowerCase().replace(/\s+/g, "");
          
          if (!taskNameGroups[normalizedKey]) {
            taskNameGroups[normalizedKey] = [];
            taskDisplayNameMap[normalizedKey] = rawName.toUpperCase();
          }
          taskNameGroups[normalizedKey].push(t);
        });

        Object.keys(taskNameGroups).forEach((normalizedTaskKey) => {
          const tasksUnderName = taskNameGroups[normalizedTaskKey];
          const taskDisplayTitle = taskDisplayNameMap[normalizedTaskKey];

          // Collect unique question names (ignore case and internal whitespace)
          const quesNameMap = {}; // normalizedKey -> UPPERCASE_NAME
          tasksUnderName.forEach((t) => t.questionsList.forEach((q) => { 
            if (q.QuesName) {
              const qKey = q.QuesName.toLowerCase().replace(/\s+/g, "");
              if (!quesNameMap[qKey]) {
                quesNameMap[qKey] = q.QuesName.toUpperCase();
              }
            }
          }));

          const qKeys = Object.keys(quesNameMap);
          const qDisplayNames = qKeys.map(k => quesNameMap[k]);

          // Title rows: Task Name on top, Supervisor below
          sheetData.push([taskDisplayTitle]);
          sheetData.push([supervisorName.toUpperCase()]); // Making supervisor uppercase too for consistency
          sheetData.push([]);

          // Header row — Location | Date | <Questions...> | Remarks
          sheetData.push(["LOCATION", "DATE", ...qDisplayNames, "REMARKS"]);

          // One row per task (location + date)
          tasksUnderName.forEach((task) => {
            // Parse task date
            const rawDate = task?.UpdatedOn || task?.DateFrom || "";
            const dateMoment = moment(rawDate, ["DD-MM-YYYY", "YYYY-MM-DD", "DD/MM/YYYY", moment.ISO_8601]);
            const displayDate = dateMoment.isValid() ? dateMoment.format("DD-MM-YYYY") : rawDate;

            const row = [task.Location || "", displayDate];

            const specificRemarks = [];
            qKeys.forEach((qKey) => {
              // Compare normalized qKey
              const matched = task.questionsList.find((q) => (q.QuesName || "").toLowerCase().replace(/\s+/g, "") === qKey);
              if (matched) {
                const qAction = String(matched.Action || "").toLowerCase();
                const qRemark = (matched.Remark || "").trim();
                const hasProblematicRemark = qRemark && qRemark.toLowerCase() !== "all";
                
                // Mark as ✘ if it's specifically problematic (actionable/pending) OR it has a remark
                const isProblematic = qAction === "actionable" || qAction === "pending" || hasProblematicRemark;
                row.push(isProblematic ? "✘" : "✔");

                // Collect ordered remark
                if (hasProblematicRemark) {
                  const qDisplayName = (matched.QuesName || "").toUpperCase();
                  specificRemarks.push(`${qDisplayName}: ${qRemark}`);
                }
              } else {
                row.push("");
              }
            });

            let finalTaskRemark = task.Remarks || "";
            if (finalTaskRemark.toLowerCase().trim() === "all") {
              finalTaskRemark = "";
            }

            // Join multiple remarks with a newline for a multiline cell effect
            const combinedRemarks = specificRemarks.length > 0 ? specificRemarks.join("\n") : finalTaskRemark;
            row.push(combinedRemarks);
            sheetData.push(row);
          });

          sheetData.push([]);
          sheetData.push([]);
        });

        const safeSheetName = supervisorName.replace(/[\[\]*\\/\?:]/g, "").substring(0, 31) || "Sheet";
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
      });

      XLSX.writeFile(wb, "TaskList_Supervisor_Report.xlsx");
    } catch (err) {
      console.error("Custom export failed:", err);
      appCommon.showtextalert("Export failed", "Please try again", "error");
    } finally {
      this.setState({ exporting: false });
    }
  };

  TaskList.prototype.handleExportWithQuestions = async function () {
    // ⭐ Property 43 (BITS Pilani) → custom supervisor matrix export
    const propVal = Number(this.props.PropertyVal);
    if (propVal === 43) {
      return this.handleCustomPropertyExport();
    }

    if (this.state.exporting) return;

    const tasks = Array.isArray(this.state.data) ? this.state.data : [];
    if (!tasks.length) {
      appCommon.showtextalert("No tasks available to export", "", "warning");
      return;
    }

    this.setState({ exporting: true, exportTotal: tasks.length, exportProcessed: 0 });

    try {
      const questionCache = new Map();
      const exportRows = new Array(tasks.length);
      let cursor = 0;
      let processed = 0;

      const worker = async () => {
        while (true) {
          const currentIndex = cursor;
          cursor += 1;
          if (currentIndex >= tasks.length) return;

          const task = tasks[currentIndex];
          const cacheKey = `${task?.TaskId || ""}|${task?.UpdatedOn || ""}`;

          if (!questionCache.has(cacheKey)) {
            const fetched = await this.fetchQuestionsForTask(task);
            questionCache.set(cacheKey, fetched || []);
          }

          const questions = questionCache.get(cacheKey) || [];
          const questionnaireText = questions.length
            ? questions.map((q, i) => `${i + 1}. ${q.QuesName}`).join("\n")
            : "";

          const { AssignedToId, EntryType, Occurence, ...cleanTask } = task;
          exportRows[currentIndex] = {
            ...cleanTask,
            Questionnaire: questionnaireText,
          };

          processed += 1;
          if (processed % 3 === 0 || processed === tasks.length) {
            this.setState({ exportProcessed: processed });
          }
        }
      };

      const workerCount = Math.min(EXPORT_CONCURRENCY, tasks.length);
      await Promise.all(Array.from({ length: workerCount }, () => worker()));

      downloadExcel({
        fileName: "Tasklist",
        sheet: "Tasks",
        tablePayload: {
          header: Object.keys(exportRows[0] || {}),
          body: exportRows,
        },
      });
    } catch (err) {
      console.error("Export failed:", err);
      appCommon.showtextalert("Export failed", "Please try again", "error");
    } finally {
      this.setState({ exporting: false, exportProcessed: 0, exportTotal: 0 });
    }
  };

  TaskList.prototype.handleDownloadExcel = function () {
    downloadExcel({
      fileName: "TaskList",
      sheet: "react-export-table-to-excel",
      tablePayload: {
        header: this.state.header,
        body: this.state.data,
      },
    });
  };
}
