import attachRenderCards from "./renderCards";
import attachRenderTable from "./renderTable";

export default function attachRenderMethods(TaskList) {
  attachRenderCards(TaskList);
  attachRenderTable(TaskList);
}

