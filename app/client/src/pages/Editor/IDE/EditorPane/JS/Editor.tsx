import React from "react";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "@appsmith/AppRouter";
import { useJSSegmentCodeEditorRoutes } from "@appsmith/pages/Editor/IDE/EditorPane/JS/hooks";

const JSEditorSegment = () => {
  const { path } = useRouteMatch();
  const routes = useJSSegmentCodeEditorRoutes(path);
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

export default JSEditorSegment;
