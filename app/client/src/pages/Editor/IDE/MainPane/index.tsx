import React from "react";
import { BUILDER_PATH } from "constants/routes";
import { Route, Switch, useRouteMatch } from "react-router";
import * as Sentry from "@sentry/react";
import useRoutes from "@appsmith/pages/Editor/IDE/MainPane/useRoutes";
import { useSelector } from "react-redux";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";
import FileTabs from "./FileTabs";

const SentryRoute = Sentry.withSentryRouting(Route);
export const MainPane = (props: { id: string }) => {
  const { path } = useRouteMatch();
  const routes = useRoutes(path);
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const editorMode = useSelector(getIDEViewMode);

  return (
    <div
      className="relative flex flex-col flex-1 overflow-auto z-2"
      id={props.id}
    >
      {isSideBySideEnabled && editorMode === EditorViewMode.FullScreen ? (
        <FileTabs />
      ) : null}
      <Switch key={BUILDER_PATH}>
        {routes.map((route) => (
          <SentryRoute {...route} key={route.key} />
        ))}
      </Switch>
    </div>
  );
};

export default MainPane;
