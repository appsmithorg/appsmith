import React from "react";
import { Route, Switch, useRouteMatch } from "react-router";
import * as Sentry from "@sentry/react";
import useRoutes from "@appsmith/pages/Editor/IDE/MainPane/useRoutes";
import { WORKFLOW_EDITOR_URL } from "@appsmith/constants/routes/workflowRoutes";

const SentryRoute = Sentry.withSentryRouting(Route);
export const MainPane = (props: { id: string }) => {
  const { path } = useRouteMatch();
  const routes = useRoutes(path);

  return (
    <div
      className="relative flex flex-col flex-1 overflow-auto z-2"
      id={props.id}
    >
      <Switch key={WORKFLOW_EDITOR_URL}>
        {routes.map((route) => (
          <SentryRoute {...route} key={route.key} />
        ))}
      </Switch>
    </div>
  );
};

export default MainPane;
