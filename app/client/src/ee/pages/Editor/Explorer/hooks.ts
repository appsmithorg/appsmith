export * from "ce/pages/Editor/Explorer/hooks";
import { useActiveAction as useCEActiveAction } from "ce/pages/Editor/Explorer/hooks";
import { MODULE_INSTANCE_ID_PATH } from "@appsmith/constants/routes/eeAppRoutes";
import { BUILDER_PATH, BUILDER_PATH_DEPRECATED } from "constants/routes";
import { matchPath, useLocation } from "react-router";

export function useActiveAction() {
  const location = useLocation();

  const baseMatch = matchPath<{ apiId: string }>(location.pathname, {
    path: [BUILDER_PATH, BUILDER_PATH_DEPRECATED],
    strict: false,
    exact: false,
  });

  const basePath = baseMatch?.path || "";

  const ceActiveAction = useCEActiveAction();

  if (ceActiveAction) return ceActiveAction;

  const moduleInstanceMatch = matchPath<{ moduleInstanceId: string }>(
    location.pathname,
    {
      path: `${basePath}${MODULE_INSTANCE_ID_PATH}`,
    },
  );
  if (moduleInstanceMatch?.params?.moduleInstanceId) {
    return moduleInstanceMatch.params.moduleInstanceId;
  }
}
