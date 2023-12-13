import React, { useMemo } from "react";
import "./styles.css";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { getAnvilCanvasId } from "./utils";
import { LayoutProvider } from "../layoutComponents/LayoutProvider";

export const AnvilCanvas = (props: BaseWidgetProps) => {
  const className: string = useMemo(
    () => `anvil-canvas ${props.classList?.join(" ")}`,
    [props.classList],
  );

  return (
    <div className={className} id={getAnvilCanvasId(props.widgetId)}>
      <LayoutProvider {...props} />
    </div>
  );
};
