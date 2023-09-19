// This layout component is just created to test out the LayoutComponentHOC
// A proper implementation will be added later

import React from "react";
import type {
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Row.renderChildren = (props: LayoutComponentProps) => {
  return (
    <>
      <div>one</div>
      <div>two</div>
    </>
  );
};

Row.getWidth = () => {
  return 100;
};

export default Row;
