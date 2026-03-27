import React from "react";
import CreateTaskPage from "./taskPage/pages/CreateTaskPage";
import EditTaskPage from "./taskPage/pages/EditTaskPage";
import ViewTaskPage from "./taskPage/pages/ViewTaskPage";

export default function TaskPage(props) {
  const mode = props.mode || "view";
  if (mode === "create") return <CreateTaskPage {...props} />;
  if (mode === "edit") return <EditTaskPage {...props} />;
  return <ViewTaskPage {...props} />;
}

