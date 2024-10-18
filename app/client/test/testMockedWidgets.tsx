import { APP_MODE } from "entities/App";
import AppViewerPageContainer from "pages/AppViewer/AppViewerPageContainer";
import Canvas from "pages/Editor/Canvas";
import IDE from "pages/Editor/IDE";
import React from "react";
import { useSelector } from "react-redux";
import { getCanvasWidgetsStructure } from "ee/selectors/entitiesSelector";
import { useMockDsl } from "./testCommon";

export function MockCanvas() {
  const canvasWidgetsStructure = useSelector(getCanvasWidgetsStructure);

  return <Canvas canvasWidth={0} widgetsStructure={canvasWidgetsStructure} />;
}

export function UpdateAppViewer({ dsl }: { dsl: unknown }) {
  const hasLoaded = useMockDsl(dsl, APP_MODE.PUBLISHED);

  return hasLoaded ? <AppViewerPageContainer /> : null;
}
export function UpdatedEditor({ dsl }: { dsl: unknown }) {
  const hasLoaded = useMockDsl(dsl, APP_MODE.EDIT);

  return hasLoaded ? <IDE /> : null;
}
