import { APP_MODE } from "entities/App";
import AppViewerPageContainer from "pages/AppViewer/AppViewerPageContainer";
import Canvas from "pages/Editor/Canvas";
import MainContainer from "pages/Editor/MainContainer";
import React from "react";
import { useSelector } from "react-redux";
import { getCanvasWidgetsStructure } from "selectors/entitiesSelector";
import { useMockDsl } from "./testCommon";

export function MockCanvas() {
  const canvasWidgetsStructure = useSelector(getCanvasWidgetsStructure);
  return <Canvas widgetsStructure={canvasWidgetsStructure} pageId="" canvasWidth={0} />;
}

export function UpdateAppViewer({ dsl }: any) {
  useMockDsl(dsl, APP_MODE.PUBLISHED);
  return <AppViewerPageContainer />;
}
export function UpdatedEditor({ dsl }: any) {
  useMockDsl(dsl, APP_MODE.EDIT);
  return <MainContainer />;
}
