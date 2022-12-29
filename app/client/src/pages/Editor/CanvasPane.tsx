import React from "react";
import WidgetsEditor from "pages/Editor/WidgetsEditor";
import { useSelector } from "react-redux";
import { getCanvasScale, getCanvasWidth } from "selectors/editorSelectors";

const CanvasPane = () => {
  const canvasWidth = useSelector(getCanvasWidth);
  const canvasScale = useSelector(getCanvasScale);
  const width = canvasWidth * canvasScale + 7;
  return (
    <div className="ml-5" style={{ width: width.toFixed(0) + "px" }}>
      <WidgetsEditor />
    </div>
  );
};

export default CanvasPane;
