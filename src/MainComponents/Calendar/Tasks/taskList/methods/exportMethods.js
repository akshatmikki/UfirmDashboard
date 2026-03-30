import { downloadExcel } from "react-export-table-to-excel";
import * as appCommon from "../../../../../Common/AppCommon.js";

export default function attachExportMethods(TaskList) {
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
      const date = task.UpdatedOn.split("-");
      const updatedOn = `${date[2]}-${date[1]}-${date[0]}`;

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

    this.setState({ exporting: true });

    try {
      const exportRows = [];

      for (const task of this.state.data) {
        const questions = await this.fetchQuestionsForTask(task);

        const questionnaireText = questions.length
          ? questions.map((q, i) => `${i + 1}. ${q.QuesName}`).join("\n")
          : "";

        const { AssignedToId, EntryType, Occurence, ...cleanTask } = task;

        exportRows.push({
          ...cleanTask,
          Questionnaire: questionnaireText,
        });
      }

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
      this.setState({ exporting: false });
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
