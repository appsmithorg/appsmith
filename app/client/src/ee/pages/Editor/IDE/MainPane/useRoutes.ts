export * from "ce/pages/Editor/IDE/MainPane/useRoutes";
import { default as useCE_Routes } from "ce/pages/Editor/IDE/MainPane/useRoutes";
import type { RouteReturnType } from "ce/pages/Editor/IDE/MainPane/useRoutes";
import QueryModuleInstanceEditor from "@appsmith/pages/Editor/ModuleInstanceEditor/Query";
import { MODULE_INSTANCE_ID_PATH } from "@appsmith/constants/routes/eeAppRoutes";
import { useSelector } from "react-redux";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";
import ModuleEditor from "../../ModuleEditor";
import {
  MODULE_API_EDITOR_PATH,
  MODULE_EDITOR_PATH,
  MODULE_JS_COLLECTION_EDITOR_PATH,
  MODULE_QUERY_EDITOR_PATH,
  SAAS_EDITOR_API_ID_PATH,
} from "@appsmith/constants/routes/packageRoutes";
import ModuleQueryEditor from "../../ModuleEditor/ModuleQueryEditor";
import ModuleApiEditor from "../../ModuleEditor/ModuleApiEditor";

function useRoutes(path: string) {
  const ceRoutes = useCE_Routes(path);
  const showQueryModule = useSelector(getShowQueryModule);

  let moduleRoutes: RouteReturnType[] = [];

  if (showQueryModule) {
    moduleRoutes = [
      {
        key: "QueryModuleInstance",
        component: QueryModuleInstanceEditor,
        exact: true,
        path: `${path}${MODULE_INSTANCE_ID_PATH}`,
      },
      {
        key: "ModuleEditor",
        component: ModuleEditor,
        exact: true,
        path: `${MODULE_EDITOR_PATH}`,
      },
      {
        key: "ModuleQueryEditor",
        component: ModuleQueryEditor,
        path: `${MODULE_EDITOR_PATH}${MODULE_QUERY_EDITOR_PATH}`,
      },
      {
        key: "ModuleQueryEditor",
        component: ModuleQueryEditor,
        path: `${MODULE_EDITOR_PATH}${SAAS_EDITOR_API_ID_PATH}`,
      },
      {
        key: "ModuleApiEditor",
        component: ModuleApiEditor,
        path: `${MODULE_EDITOR_PATH}${MODULE_API_EDITOR_PATH}`,
      },
      {
        key: "ModuleJSEditor",
        component: ModuleApiEditor,
        path: `${MODULE_EDITOR_PATH}${MODULE_JS_COLLECTION_EDITOR_PATH}`,
      },
    ];
  }

  return [...ceRoutes, ...moduleRoutes];
}

export default useRoutes;
