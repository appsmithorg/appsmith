import Canvas from "pages/Editor/Canvas";
import React from "react";
import { useSelector } from "react-redux";
import { mockGetCanvasWidgetDsl } from "./testCommon";

export const MockCanvas = () => {
  const dsl = useSelector(mockGetCanvasWidgetDsl);
  return <Canvas dsl={dsl}></Canvas>;
};
