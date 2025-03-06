import React from "react";
import { useRouteMatch } from "react-router";
import { Switch } from "react-router-dom";
import { QueryEditorRoutes } from "ee/pages/AppIDE/layouts/routers/QueryEditor/constants";
import { SentryRoute } from "components/SentryRoute";

const QueryEditor = () => {
  const { path } = useRouteMatch();
  const routes = QueryEditorRoutes(path);

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
