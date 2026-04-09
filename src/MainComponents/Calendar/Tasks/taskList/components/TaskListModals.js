import React from "react";
import TaskPage from "../../TaskPage";

export default function TaskListModals({ ctx }) {
  return (
    <>
      {ctx.state.showAddModal ? (
        <TaskPage
          mode="create"
          visible={ctx.state.showAddModal}
          closeModal={ctx.closeModal}
          categoryData={ctx.state.CategoryData}
          onTaskAdded={() => ctx.getTasks()}
          type={"PPMtask"}
          PropertyId={ctx.props.PropertyVal}
        />
      ) : null}

      {ctx.state.showTaskModal ? (
        <TaskPage
          mode="view"
          visible={ctx.state.showTaskModal}
          closeModal={ctx.closeModal}
          rowData={ctx.state.rowData}
          onTaskUpdated={() => ctx.getTasks()}
        />
      ) : null}

      {ctx.state.showEditModal ? (
        <TaskPage
          mode="edit"
          visible={ctx.state.showEditModal}
          closeModal={ctx.closeModal}
          rowData={ctx.state.rowData}
          categoryData={ctx.state.CategoryData}
          openAddQuestion={ctx.state.openAddQuestion}
          onTaskUpdated={() => ctx.getTasks()}
        />
      ) : null}
    </>
  );
}
