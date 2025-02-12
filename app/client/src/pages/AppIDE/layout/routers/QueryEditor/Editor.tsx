import React from "react";
import { useRouteMatch } from "react-router";
import { Switch } from "react-router-dom";
import { useQueryEditorRoutes } from "ee/pages/AppIDE/layouts/routers/QueryEditor/useQueryEditorRoutes";
import { SentryRoute } from "ee/AppRouter";

const QueryEditor = () => {
  const { path } = useRouteMatch();
  const routes = useQueryEditorRoutes(path);

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

export { QueryEditor };
