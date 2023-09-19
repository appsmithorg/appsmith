// This layout component is just created to test out the LayoutComponentHOC
// A proper implementation will be added later

import React from "react";
import type {
  // LayoutComponentChildrenMap,
  LayoutComponentProps,
  LayoutComponentType,
} from "../utils/anvilTypes";
import { FlexLayout } from "./components/FlexLayout";

const Row = (props: LayoutComponentProps) => {
  const { layoutStyle } = props;

  return (
    <FlexLayout
      canvasId="test-canvas-id"
      direction="row"
      layoutId={props.layoutId}
      {...(layoutStyle || {})}
    >
      {props.children}
    </FlexLayout>
  );
};

Row.type = "ROW" as LayoutComponentType;

Row.renderChildren = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  props: LayoutComponentProps,
  // childrenMap: LayoutComponentChildrenMap,
) => {
  // TODO: Call WidgetFactory.createWidget directly or a utility that abstracts repeated code
  return (
    <>
      <div>one (ROW)</div>
      <div>two (ROW)</div>
    </>
  );
};

Row.getWidth = () => {
  return 100;
};

export default Row;
