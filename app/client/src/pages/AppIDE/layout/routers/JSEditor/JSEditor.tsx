import React from "react";
import { Switch, useRouteMatch } from "react-router";
import { JSEditorRoutes } from "ee/pages/AppIDE/layouts/routers/JSEditor/constants";
import { SentryRoute } from "ee/AppRouter";

const JSEditorPane = () => {
  const { path } = useRouteMatch();
  const routes = JSEditorRoutes(path);

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

export { JSEditorPane };
