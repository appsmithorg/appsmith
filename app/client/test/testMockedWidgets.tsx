import Canvas from "pages/Editor/Canvas";
import MainContainer from "pages/Editor/MainContainer";
import React from "react";
import { useSelector } from "react-redux";
import { mockGetCanvasWidgetDsl, useMockDsl } from "./testCommon";

export function MockCanvas() {
  const dsl = useSelector(mockGetCanvasWidgetDsl);
  return <Canvas dsl={dsl} />;
}
export function UpdatedMainContainer({ dsl }: any) {
  useMockDsl(dsl);
  return <MainContainer />;
}
