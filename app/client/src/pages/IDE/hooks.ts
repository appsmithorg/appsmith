import { useRouteMatch } from "react-router";
import { IDE_PAGE_NAV_PATH, IDE_PATH } from "../../constants/routes";
import type { IDEAppState, PageNavState } from "./ideReducer";

export const useIDENavState = (): [
  { ideState?: IDEAppState; pageNav?: PageNavState; pageId?: string },
] => {
  const appNavState = useRouteMatch<{ ideState: IDEAppState }>({
    path: IDE_PATH,
  });
  const pageNavState = useRouteMatch<{ pageNav: PageNavState; pageId: string }>(
    {
      path: IDE_PAGE_NAV_PATH,
    },
  );
  const ideNavState = { ...appNavState?.params, ...pageNavState?.params };
  return [ideNavState];
};
