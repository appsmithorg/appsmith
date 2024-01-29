import React, { useCallback, useMemo } from "react";
import "./styles.css";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { getAnvilCanvasId } from "./utils";
import { LayoutProvider } from "../layoutComponents/LayoutProvider";
import { useClickToClearSelections } from "./useClickToClearSelections";
import { useRenderDetachedChildren } from "../common/hooks/detachedWidgetHooks";

export const AnvilCanvas = (props: BaseWidgetProps) => {
  const className: string = useMemo(
    () => `anvil-canvas ${props.classList?.join(" ")}`,
    [props.classList],
  );

  const clickToClearSelections = useClickToClearSelections(props.widgetId);
  const handleOnClickCapture = useCallback(
    (event) => {
      clickToClearSelections(event);
    },
    [clickToClearSelections],
  );

  const renderDetachedChildren = useRenderDetachedChildren(
    props.widgetId,
    props.children,
  );

  return (
    <>
      {renderDetachedChildren}
      <div
        className={className}
        id={getAnvilCanvasId(props.widgetId)}
        onClick={handleOnClickCapture}
      >
        <LayoutProvider {...props} />
      </div>
    </>
  );
};
