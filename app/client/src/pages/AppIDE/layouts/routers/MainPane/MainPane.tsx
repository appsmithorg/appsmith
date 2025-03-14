import React from "react";
import { Switch, useRouteMatch, type RouteProps } from "react-router";
import { MainPaneRoutes } from "ee/pages/AppIDE/layouts/routers/MainPane/constants";
import { useSelector } from "react-redux";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";
import WidgetsEditor from "pages/Editor/WidgetsEditor";
import { useWidgetSelectionBlockListener } from "../../hooks/useWidgetSelectionBlockListener";
import { SentryRoute } from "components/SentryRoute";

export const MainPane = (props: { id: string }) => {
  const { path } = useRouteMatch();
  const routes: Array<RouteProps & { key: string }> = MainPaneRoutes(path);

  useWidgetSelectionBlockListener();

  const isPreviewMode = useSelector(selectCombinedPreviewMode);

  return (
    <div
      className="relative flex flex-col flex-1 overflow-auto z-2 h-full"
      data-testid="t--ide-main-pane"
      id={props.id}
    >
      {isPreviewMode ? (
        <WidgetsEditor />
      ) : (
        <Switch>
          {routes.map((route) => (
            <SentryRoute {...route} key={route.key} />
          ))}
        </Switch>
      )}
    </div>
  );
};

export default MainPane;
