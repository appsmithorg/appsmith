import Canvas from "pages/Editor/Canvas";
import MainContainer from "pages/Editor/MainContainer";
import React from "react";
import { useSelector } from "react-redux";
import { getCanvasWidgetsStructure } from "selectors/entitiesSelector";
import { useMockDsl } from "./testCommon";

export function MockCanvas() {
  const canvasWidgetsStructure = useSelector(getCanvasWidgetsStructure);
  return <Canvas widgetsStructure={canvasWidgetsStructure} />;
}
export function UpdatedMainContainer({ dsl }: any) {
  useMockDsl(dsl);
  return <MainContainer />;
}
