import React from "react";

import { SentryRoute } from "ee/AppRouter";
import { useQueryEditorRoutes } from "ee/pages/Editor/IDE/EditorPane/Query/hooks";
import { useRouteMatch } from "react-router";
import { Switch } from "react-router-dom";

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
