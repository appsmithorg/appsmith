import { useRouteMatch } from "react-router";
import { IDE_PAGE_NAV_PATH, IDE_PATH } from "../../constants/routes";

export const useIDENavState = (): [{ ideState?: string; pageNav?: string }] => {
  const appNavState = useRouteMatch<{ ideState: string }>({ path: IDE_PATH });
  const pageNavState = useRouteMatch<{ pageNav: string }>({
    path: IDE_PAGE_NAV_PATH,
  });
  const ideNavState = { ...appNavState?.params, ...pageNavState?.params };
  return [ideNavState];
};
