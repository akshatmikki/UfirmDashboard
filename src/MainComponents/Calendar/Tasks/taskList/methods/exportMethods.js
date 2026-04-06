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
      const dateMoment = moment(task?.UpdatedOn, ["YYYY-MM-DD", "DD-MM-YYYY", moment.ISO_8601], true);
      const updatedOn = dateMoment.isValid() ? dateMoment.format("DD-MM-YYYY") : "";

      if (!taskId || !updatedOn) return [];

      const model = [{ CmdType: "R", Id: taskId, date: updatedOn }];
      const resp = await this.ApiProvider.manageQues(model, "R");

      if (resp.ok && resp.status === 200) {
        const rData = await resp.json();
        return rData.map((q) => ({
          QuesId: q.QuestID,
          QuesName: q.QuestionName,
        }));
      }

      return [];
    } catch (e) {
      console.error("Question fetch failed for task", task.TaskId, e);
      return [];
    }
  };

  TaskList.prototype.handleExportWithQuestions = async function () {
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
