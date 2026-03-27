import attachApiModelsManage from "./apiModelsManage";
import attachApiFetch from "./apiFetch";
import attachLifecycleMethods from "./lifecycleMethods";

export default function attachApiMethods(TaskList) {
  attachApiModelsManage(TaskList);
  attachApiFetch(TaskList);
  attachLifecycleMethods(TaskList);
}

