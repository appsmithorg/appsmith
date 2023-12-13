import React from "react";
import "./styles.css";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { getAnvilCanvasId } from "./utils";
import { LayoutProvider } from "../layoutComponents/LayoutProvider";

export const AnvilCanvas = (props: BaseWidgetProps) => {
  const className: string = `anvil-canvas ${props.classList?.join(" ")}`;

  return (
    <div className={className} id={getAnvilCanvasId(props.widgetId)}>
      <LayoutProvider {...props} />
    </div>
  );
};
