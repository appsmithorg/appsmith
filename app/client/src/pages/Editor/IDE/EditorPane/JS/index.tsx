import React from "react";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "@appsmith/AppRouter";
import { CodeRoutes } from "./CodeRoutes";
import { ListRoutes } from "./ListRoutes";

export const CodeJSSegment = () => {
  const { path } = useRouteMatch();
  const routes = CodeRoutes(path);
  return (
    <Switch>
      {routes.map((route) => (
        <SentryRoute
          component={route.component}
          exact={route.exact}
          key={route.key}
          path={route.path}
        />
      ))}
    </Switch>
  );
};

export const ListJSSegment = () => {
  const { path } = useRouteMatch();
  const routes = ListRoutes(path);
  return (
    <Switch>
      {routes.map((route) => (
        <SentryRoute
          component={route.component}
          exact={route.exact}
          key={route.key}
          path={route.path}
        />
      ))}
    </Switch>
  );
};
