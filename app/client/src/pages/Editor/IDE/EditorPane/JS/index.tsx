import React from "react";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "@appsmith/AppRouter";
import { useJSSegmentRoutes } from "@appsmith/pages/Editor/IDE/EditorPane/JS/hooks";

const JSSegment = () => {
  const { path } = useRouteMatch();
  const routes = useJSSegmentRoutes(path);
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

export default JSSegment;
