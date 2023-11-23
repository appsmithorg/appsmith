export * from "ce/pages/Editor/IDE/MainPane/useRoutes";
import { default as useCE_Routes } from "ce/pages/Editor/IDE/MainPane/useRoutes";
import type { RouteReturnType } from "ce/pages/Editor/IDE/MainPane/useRoutes";
import QueryModuleInstanceEditor from "@appsmith/pages/Editor/ModuleInstanceEditor/Query";
import { MODULE_INSTANCE_ID_PATH } from "@appsmith/constants/routes/eeAppRoutes";
import { useSelector } from "react-redux";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";

function useRoutes(path: string) {
  const ceRoutes = useCE_Routes(path);
  const showQueryModule = useSelector(getShowQueryModule);

  const moduleRoutes: RouteReturnType[] = [];

  if (showQueryModule) {
    moduleRoutes.push({
      key: "QueryModuleInstance",
      component: QueryModuleInstanceEditor,
      exact: true,
      path: `${path}${MODULE_INSTANCE_ID_PATH}`,
    });
  }

  return [...ceRoutes, ...moduleRoutes];
}

export default useRoutes;
