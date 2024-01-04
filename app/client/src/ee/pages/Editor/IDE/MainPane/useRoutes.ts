export * from "ce/pages/Editor/IDE/MainPane/useRoutes";
import { default as useCE_Routes } from "ce/pages/Editor/IDE/MainPane/useRoutes";
import type { RouteReturnType } from "ce/pages/Editor/IDE/MainPane/useRoutes";
import ModuleInstanceEditor from "@appsmith/pages/Editor/ModuleInstanceEditor";
import { MODULE_INSTANCE_ID_PATH } from "@appsmith/constants/routes/appRoutes";
import { useSelector } from "react-redux";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";
import ModuleEditor from "../../ModuleEditor";
import { MODULE_EDITOR_PATH } from "@appsmith/constants/routes/packageRoutes";
import { getShowWorkflowFeature } from "@appsmith/selectors/workflowSelectors";
import WorkflowQueryEditor from "../../WorkflowEditor/WorkflowQueryEditor";
import {
  SAAS_EDITOR_API_ID_PATH,
  WORKFLOW_API_EDITOR_PATH,
  WORKFLOW_EDITOR_URL,
  WORKFLOW_QUERY_EDITOR_PATH,
} from "@appsmith/constants/routes/workflowRoutes";
import WorkflowApiEditor from "../../WorkflowEditor/WorkflowApiEditor";

function useRoutes(path: string) {
  const ceRoutes = useCE_Routes(path);
  const showQueryModule = useSelector(getShowQueryModule);
  const showWorkflows = useSelector(getShowWorkflowFeature);

  let moduleRoutes: RouteReturnType[] = [];
  let workflowRoutes: RouteReturnType[] = [];

  if (showQueryModule) {
    moduleRoutes = [
      {
        key: "ModuleInstance",
        component: ModuleInstanceEditor,
        exact: true,
        path: `${path}${MODULE_INSTANCE_ID_PATH}`,
      },
      {
        key: "ModuleEditor",
        component: ModuleEditor,
        path: `${MODULE_EDITOR_PATH}`,
      },
    ];
  }

  if (showWorkflows) {
    workflowRoutes = [
      {
        key: "WorkflowQueryEditor",
        component: WorkflowQueryEditor,
        path: `${WORKFLOW_EDITOR_URL}${WORKFLOW_QUERY_EDITOR_PATH}`,
        exact: true,
      },
      {
        key: "WorkflowSaasQueryEditor",
        component: WorkflowQueryEditor,
        path: `${WORKFLOW_EDITOR_URL}${SAAS_EDITOR_API_ID_PATH}`,
        exact: true,
      },
      {
        key: "WorkflowApiEditor",
        component: WorkflowApiEditor,
        path: `${WORKFLOW_EDITOR_URL}${WORKFLOW_API_EDITOR_PATH}`,
        exact: true,
      },
    ];
  }

  return [...workflowRoutes, ...ceRoutes, ...moduleRoutes];
}

export default useRoutes;
