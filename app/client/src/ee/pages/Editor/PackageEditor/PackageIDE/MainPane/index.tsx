import React from "react";
import { Route, Switch, useRouteMatch } from "react-router";
import * as Sentry from "@sentry/react";
import { PACKAGE_EDITOR_PATH } from "@appsmith/constants/routes/packageRoutes";
import useRoutes from "@appsmith/pages/Editor/IDE/MainPane/useRoutes";
import PackageDefaultState from "./PackageDefaultState";
import useLastVisitedModule from "./useLastVisitedModule";

interface MainRouteParams {
  packageId: string;
}

const SentryRoute = Sentry.withSentryRouting(Route);
export const MainPane = (props: { id: string }) => {
  const { params, path } = useRouteMatch<MainRouteParams>();
  const routes = useRoutes(path);
  const { getLastVisited } = useLastVisitedModule({
    packageId: params.packageId,
  });
  const lastVisitedModuleId = getLastVisited();

  return (
    <div
      className="relative flex flex-col flex-1 overflow-auto z-2"
      id={props.id}
    >
      <Switch key={PACKAGE_EDITOR_PATH}>
        {routes.map((route) => (
          <SentryRoute {...route} key={route.key} />
        ))}
        <SentryRoute
          component={() => (
            <PackageDefaultState lastVisitedModuleId={lastVisitedModuleId} />
          )}
          exact
          path={PACKAGE_EDITOR_PATH}
        />
      </Switch>
    </div>
  );
};

export default MainPane;
