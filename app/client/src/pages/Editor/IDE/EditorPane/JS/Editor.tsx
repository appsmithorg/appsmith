import React from "react";

import { SentryRoute } from "ee/AppRouter";
import { useJSEditorRoutes } from "ee/pages/Editor/IDE/EditorPane/JS/hooks";
import { Switch, useRouteMatch } from "react-router";

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
