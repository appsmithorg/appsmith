import React from "react";
import { Route, Switch, useRouteMatch } from "react-router";
import * as Sentry from "@sentry/react";
import useMainPaneRoutes from "ee/pages/AppIDE/layouts/hooks/useMainPaneRoutes";
import { useWidgetSelectionBlockListener } from "../hooks/useWidgetSelectionBlockListener";

const SentryRoute = Sentry.withSentryRouting(Route);

export const MainPane = (props: { id: string }) => {
  const { path } = useRouteMatch();
  const routes = useMainPaneRoutes(path);

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
