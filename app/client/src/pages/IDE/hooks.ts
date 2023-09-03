import { useRouteMatch } from "react-router";
import { IDE_PAGE_NAV_PATH, IDE_PATH } from "../../constants/routes";
import type { IDEAppState } from "./ideReducer";

export const useIDENavState = (): [
  { ideState?: IDEAppState; pageNav?: string; pageId?: string },
] => {
  const appNavState = useRouteMatch<{ ideState: IDEAppState }>({
    path: IDE_PATH,
  });
  const pageNavState = useRouteMatch<{ pageNav: string; pageId: string }>({
    path: IDE_PAGE_NAV_PATH,
  });
  const ideNavState = { ...appNavState?.params, ...pageNavState?.params };
  return [ideNavState];
};
