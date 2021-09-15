import { theme } from "constants/DefaultTheme";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import React, { useMemo } from "react";
import styled from "styled-components";
import { useCanvasDragging } from "utils/hooks/useCanvasDragging";

const StyledSelectionCanvas = styled.div<{ paddingBottom: number }>`
  position: absolute;
  top: 0px;
  left: 0px;
  height: calc(100% + ${(props) => props.paddingBottom}px);
  width: 100%;
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  overflow-y: auto;
`;

export interface SelectedArenaDimensions {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface CanvasDraggingArenaProps {
  canExtend: boolean;
  detachFromLayout?: boolean;
  dropDisabled?: boolean;
  noPad?: boolean;
  snapColumnSpace: number;
  snapRows: number;
  snapRowSpace: number;
  widgetId: string;
}

export function CanvasDraggingArena({
  canExtend,
  dropDisabled = false,
  noPad,
  snapColumnSpace,
  snapRows,
  snapRowSpace,
  widgetId,
}: CanvasDraggingArenaProps) {
  const needsPadding = useMemo(() => {
    return widgetId === MAIN_CONTAINER_WIDGET_ID;
  }, [widgetId]);

  const canvasRef = React.useRef<HTMLDivElement>(null);
  const canvasDrawRef = React.useRef<HTMLCanvasElement>(null);
  const { showCanvas } = useCanvasDragging(canvasRef, canvasDrawRef, {
    canExtend,
    dropDisabled,
    noPad,
    snapColumnSpace,
    snapRows,
    snapRowSpace,
    widgetId,
  });

  return showCanvas ? (
    <>
      <canvas ref={canvasDrawRef} />
      <StyledSelectionCanvas
        data-testid={`canvas-dragging-${widgetId}`}
        id={`canvas-dragging-${widgetId}`}
        paddingBottom={needsPadding ? theme.canvasBottomPadding : 0}
        ref={canvasRef}
      />
    </>
  ) : null;
}
CanvasDraggingArena.displayName = "CanvasDraggingArena";
