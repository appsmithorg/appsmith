import type {
  LayoutComponentProps,
  LayoutComponentType,
} from "layoutSystems/anvil/utils/anvilTypes";
import React from "react";
import { FlexLayout } from "./FlexLayout";
import { doesAlignedRowRenderWidgets } from "layoutSystems/anvil/utils/layouts/typeUtils";

const AlignedRow = (props: LayoutComponentProps) => {
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

AlignedRow.type = "ALIGNED_ROW" as LayoutComponentType;

AlignedRow.getWidth = () => {
  return 100;
};

AlignedRow.deriveHighlights = () => {
  return [];
};

AlignedRow.extractChildWidgetIds = (props: LayoutComponentProps): string[] => {
  return AlignedRow.rendersWidgets(props)
    ? (props.layout as string[][]).reduce((acc: string[], each: string[]) => {
        return acc.concat(each);
      }, [])
    : [];
};

AlignedRow.rendersWidgets = (props: LayoutComponentProps): boolean => {
  return doesAlignedRowRenderWidgets(props);
};

export default AlignedRow;
