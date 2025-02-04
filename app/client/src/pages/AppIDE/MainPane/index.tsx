import React from "react";
import { Route, Switch, useRouteMatch } from "react-router";
import * as Sentry from "@sentry/react";
import useRoutes from "ee/pages/AppIDE/MainPane/useRoutes";
import { useWidgetSelectionBlockListener } from "../hooks";

const SentryRoute = Sentry.withSentryRouting(Route);

export const MainPane = (props: { id: string }) => {
  const { path } = useRouteMatch();
  const routes = useRoutes(path);

  useWidgetSelectionBlockListener();

  return (
    <div
      className="relative flex flex-col flex-1 overflow-auto z-2 h-full"
      data-testid="t--ide-main-pane"
      id={props.id}
    >
      <Switch>
        {routes.map((route) => (
          <SentryRoute {...route} key={route.key} />
        ))}
      </Switch>
    </div>
  );
};

export default MainPane;
