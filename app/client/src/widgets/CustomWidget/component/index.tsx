import React from "react";
import type { ComponentProps } from "widgets/BaseComponent";

export interface CustomComponentProps extends ComponentProps {
  test?: string;
}

function CustomComponent(props: CustomComponentProps) {
  return <div id={props.widgetId}>test</div>;
}

export default CustomComponent;
