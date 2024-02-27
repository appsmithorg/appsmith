import React, { useEffect } from "react";
import { BUILDER_PATH } from "constants/routes";
import { Route, Switch, useLocation, useRouteMatch } from "react-router";
import * as Sentry from "@sentry/react";
import useRoutes from "@appsmith/pages/Editor/IDE/MainPane/useRoutes";
import EditorTabs from "pages/Editor/IDE/EditorTabs/FullScreenTabs";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { useDispatch, useSelector } from "react-redux";
import { setCanvasPreviewMode } from "actions/ideActions";
import { getCanvasPreviewMode } from "selectors/ideSelectors";

const SentryRoute = Sentry.withSentryRouting(Route);
export const MainPane = (props: { id: string }) => {
  const { path } = useRouteMatch();
  const routes = useRoutes(path);
  useCanvasViewModeListener();

  return (
    <div
      className="relative flex flex-col flex-1 overflow-auto z-2"
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
function useCanvasViewModeListener() {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const currentCanvasPreviewMode = useSelector(getCanvasPreviewMode);
  // useEffect(() => {
  //   const currentFocus = identifyEntityFromPath(pathname);
  //   if (
  //     [FocusEntity.CANVAS, FocusEntity.PROPERTY_PANE].includes(
  //       currentFocus.entity,
  //     )
  //   ) {
  //     dispatch(setCanvasPreviewMode(false));
  //   } else {
  //     dispatch(setCanvasPreviewMode(true));
  //   }
  // }, [pathname]);

  const mouseMoveHandler = (e: MouseEvent) => {
    const currentFocus = identifyEntityFromPath(pathname);
    const focusedOnCanvas = [
      FocusEntity.CANVAS,
      FocusEntity.PROPERTY_PANE,
    ].includes(currentFocus.entity);
    if (e.altKey) {
      dispatch(setCanvasPreviewMode(focusedOnCanvas));
    } else {
      dispatch(setCanvasPreviewMode(!focusedOnCanvas));
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", mouseMoveHandler);

    return () => {
      window.removeEventListener("mousemove", mouseMoveHandler);
    };
  }, [currentCanvasPreviewMode]);
}
