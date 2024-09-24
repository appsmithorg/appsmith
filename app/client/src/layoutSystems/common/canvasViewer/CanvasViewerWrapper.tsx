import { GridDefaults } from "constants/WidgetConstants";
import type { CSSProperties, ReactNode } from "react";
import React from "react";
import { getCanvasClassName } from "utils/generators";

interface CanvasViewerWrapperProps {
  snapRows: number;
  isListWidgetCanvas: boolean;
  children: ReactNode;
}

/**
 * This component is a wrapper for the canvas in the viewer.
 * It is responsible for setting the height of the canvas in view mode.
 */
export const CanvasViewerWrapper = ({
  children,
  isListWidgetCanvas,
  snapRows,
}: CanvasViewerWrapperProps) => {
  const height = snapRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
  const style: CSSProperties = {
    width: "100%",
    height: isListWidgetCanvas ? "auto" : `${height}px`,
    background: "none",
    position: "relative",
  };

  return (
    <div className={getCanvasClassName()} style={style}>
      {children}
    </div>
  );
};
