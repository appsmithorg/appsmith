export * from "ce/pages/Editor/IDE/MainPane/useRoutes";
import { default as useCE_Routes } from "ce/pages/Editor/IDE/MainPane/useRoutes";
import type { RouteReturnType } from "ce/pages/Editor/IDE/MainPane/useRoutes";
import ModuleInstanceEditor from "@appsmith/pages/Editor/ModuleInstanceEditor";
import { MODULE_INSTANCE_ID_PATH } from "@appsmith/constants/routes/eeAppRoutes";
import { useSelector } from "react-redux";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";
import ModuleEditor from "../../ModuleEditor";
import { MODULE_EDITOR_PATH } from "@appsmith/constants/routes/packageRoutes";

function useRoutes(path: string) {
  const ceRoutes = useCE_Routes(path);
  const showQueryModule = useSelector(getShowQueryModule);

  let moduleRoutes: RouteReturnType[] = [];

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

  return [...ceRoutes, ...moduleRoutes];
}

export default useRoutes;
