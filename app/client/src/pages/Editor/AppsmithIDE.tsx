import * as Sentry from "@sentry/react";
import React from "react";
import { useSelector } from "react-redux";
import { Route, Switch, useRouteMatch } from "react-router";

import BottomBar from "components/BottomBar";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  WIDGETS_EDITOR_BASE_PATH,
  WIDGETS_EDITOR_ID_PATH,
} from "constants/routes";
import { previewModeSelector } from "selectors/editorSelectors";
import WidgetsEditor from "./WidgetsEditor";
import EditorsRouter from "./routes";
import EditorWrapperBody from "./commons/EditorWrapperBody";
import EditorWrapperContainer from "./commons/EditorWrapperContainer";
import Sidebar from "components/Sidebar";
import IDESidePane from "./IDESidePane";

const SentryRoute = Sentry.withSentryRouting(Route);

/**
 * OldName: MainContainer
 */
function AppsmithIDE() {
  const { path } = useRouteMatch();
  const isPreviewMode = useSelector(previewModeSelector);

  return (
    <>
      <EditorWrapperContainer>
        <Sidebar />
        <IDESidePane />
        <EditorWrapperBody id="app-body">
          <Switch key={BUILDER_PATH}>
            <SentryRoute
              component={WidgetsEditor}
              exact
              path={BUILDER_PATH_DEPRECATED}
            />
            <SentryRoute component={WidgetsEditor} exact path={BUILDER_PATH} />
            <SentryRoute
              component={WidgetsEditor}
              exact
              path={BUILDER_CUSTOM_PATH}
            />
            <SentryRoute
              component={WidgetsEditor}
              exact
              path={`${path}${WIDGETS_EDITOR_BASE_PATH}`}
            />
            <SentryRoute
              component={WidgetsEditor}
              exact
              path={`${path}${WIDGETS_EDITOR_ID_PATH}`}
            />
            <SentryRoute component={EditorsRouter} />
          </Switch>
        </EditorWrapperBody>
      </EditorWrapperContainer>
      <BottomBar viewMode={isPreviewMode} />
    </>
  );
}

AppsmithIDE.displayName = "AppsmithIDE";

export default AppsmithIDE;
