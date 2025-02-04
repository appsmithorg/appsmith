import React from "react";
import { Switch, useRouteMatch } from "react-router";
import { useJSEditorRoutes } from "ee/pages/AppIDE/EditorPane/JS/hooks";
import { SentryRoute } from "ee/AppRouter";

const JSEditorPane = () => {
  const { path } = useRouteMatch();
  const routes = useJSEditorRoutes(path);

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
