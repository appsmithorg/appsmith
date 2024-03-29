import React from "react";
import { BUILDER_PATH } from "constants/routes";
import { Route, Switch, useRouteMatch } from "react-router";
import * as Sentry from "@sentry/react";
import useRoutes from "@appsmith/pages/Editor/IDE/MainPane/useRoutes";
import EditorTabs from "pages/Editor/IDE/EditorTabs/FullScreenTabs";
import { useWidgetSelectionBlockListener } from "pages/Editor/IDE/hooks";

const SentryRoute = Sentry.withSentryRouting(Route);
export const MainPane = (props: { id: string }) => {
  const { path } = useRouteMatch();
  const routes = useRoutes(path);
  useWidgetSelectionBlockListener();

  return (
    <div
      className="relative flex flex-col flex-1 overflow-auto z-2"
      data-testid="t--ide-main-pane"
      id={props.id}
    >
      <EditorTabs />
      <Switch key={BUILDER_PATH}>
        {routes.map((route) => (
          <SentryRoute {...route} key={route.key} />
        ))}
      </Switch>
    </div>
  );
};

export default MainPane;
