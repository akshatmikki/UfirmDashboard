import React from "react";
import Button from "../../../../ReactComponents/Button/Button";

export function TaskQuestionsCreateSection({
  taskName,
  location,
  quesValues,
  onAddQuestion,
  onRemoveQuestion,
  onQuestionNameChange,
}) {
  return (
    <div className="add-task-form">
      <div className="row mb-3">
        <div className="col-6">
          <label>Task Name</label>
          <input className="form-control" value={taskName || ""} disabled />
        </div>
        <div className="col-6">
          <label>Location</label>
          <input className="form-control" value={location || ""} disabled />
        </div>
      </div>

      <div className="row mb-2">
        <div className="col-12 d-flex justify-content-end">
          <Button ClassName="btn btn-success btn-sm" Icon={<i className="fa fa-plus" />} Text="Add Question" Action={onAddQuestion} />
        </div>
      </div>

      {(quesValues || []).map((item, index) => (
        <div key={index} className="row mb-3">
          <div className="col-10">
            <label>Question Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter Question Name"
              value={item.QuestionName || ""}
              onChange={(e) => onQuestionNameChange?.(index, e.target.value)}
            />
          </div>

          <div className="col-2 d-flex align-items-end">
            {index > 0 ? (
              <button className="btn btn-danger btn-sm" type="button" onClick={() => onRemoveQuestion?.(index)}>
                <i className="fa fa-trash" />
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TaskQuestionsEditSection({
  taskName,
  location,
  loading,
  questions,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
}) {
  return (
    <div className="add-task-form">
      <div className="row mb-3">
        <div className="col-md-4">
          <label>Task Name</label>
          <input className="form-control" value={taskName || ""} disabled />
        </div>
        <div className="col-md-4">
          <label>Location</label>
          <input className="form-control" value={location || ""} disabled />
        </div>

        <div className="col-md-4 text-right">
          <button className="btn btn-success mt-4" type="button" onClick={onAddQuestion}>
            Add Question +
          </button>
        </div>
      </div>

      {loading ? <p className="text-muted">Loading questions...</p> : null}
      {!loading && (questions || []).length === 0 ? <p className="text-muted">No questions added for this task.</p> : null}

      {!loading &&
        (questions || []).map((q) => (
          <div key={q.QuesId} className="row mb-3 align-items-center">
            <div className="col-md-9">
              <label className="mb-1">Question</label>
              <input className="form-control" value={q.QuestionName} disabled />
            </div>

            <div className="col-md-3 d-flex align-items-center gap-2 mt-4">
              <button className="btn btn-success btn-icon" type="button" onClick={() => onEditQuestion?.(q)} title="Edit">
                <i className="fa fa-edit" />
              </button>

              <button className="btn btn-danger btn-icon" type="button" onClick={() => onDeleteQuestion?.(q)} title="Delete">
                <i className="fa fa-trash" />
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}

export function TaskQuestionsViewSection({ taskName, location, questions }) {
  return (
    <div className="add-task-form">
      <div className="row mb-3">
        <div className="col-md-6">
          <label>Task Name</label>
          <input className="form-control" value={taskName || ""} disabled />
        </div>
        <div className="col-md-6">
          <label>Location</label>
          <input className="form-control" value={location || ""} disabled />
        </div>
      </div>

      {(questions || []).length === 0 ? <p className="text-muted">No questions available.</p> : null}

      {(questions || []).map((q) => (
        <div key={q.QuesId} className="row mb-3 align-items-center">
          <div className="col-md-9">
            <label className="mb-1">Question</label>
            <input className="form-control" value={q.QuesName} disabled />
          </div>

          <div className="col-md-3 d-flex align-items-center mt-4" />
        </div>
      ))}
    </div>
  );
}
