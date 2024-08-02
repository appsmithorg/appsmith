import React from "react";
import { useRouteMatch } from "react-router";
import { Switch } from "react-router-dom";
import { useQueryEditorRoutes } from "@appsmith/pages/Editor/IDE/EditorPane/Query/hooks";
import { SentryRoute } from "@appsmith/AppRouter";

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
