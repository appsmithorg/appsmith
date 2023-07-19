/* eslint-disable no-console */
import React from "react";
import type { LayoutComponentProps } from "utils/autoLayout/autoLayoutTypes";
import FlexLayout from "./FlexLayout";
import "../styles.css";
import { CanvasDraggingArena } from "pages/common/CanvasArenas/CanvasDraggingArena";
import { LayoutDirection } from "utils/autoLayout/constants";

const AlignedRow = (props: LayoutComponentProps) => {
  console.log("####", { props });
  const {
    childrenMap,
    isDropTarget,
    layout,
    layoutId,
    layoutStyle,
    layoutType,
    rendersWidgets,
  } = props;
  if (rendersWidgets && childrenMap) {
    return (
      <FlexLayout flexDirection="row" {...(layoutStyle || {})}>
        {isDropTarget && props.containerProps ? (
          <CanvasDraggingArena
            {...props.containerProps.snapSpaces}
            alignItems={props.containerProps.alignItems}
            canExtend={props.containerProps.canExtend}
            direction={
              layoutType.includes("ROW")
                ? LayoutDirection.Horizontal
                : LayoutDirection.Vertical
            }
            dropDisabled={!!props.containerProps.dropDisabled}
            layoutId={layoutId}
            noPad={props.containerProps.noPad}
            parentId={props.containerProps.parentId}
            snapRows={props.containerProps.snapRows}
            useAutoLayout={props.containerProps.useAutoLayout}
            widgetId={props.containerProps.widgetId}
            widgetName={props.containerProps.widgetName}
          />
        ) : null}
        <div className="alignment start-alignment">
          {(layout[0] as string[]).map((id: string) => childrenMap[id])}
        </div>
        <div className="alignment center-alignment">
          {(layout[1] as string[]).map((id: string) => childrenMap[id])}
        </div>
        <div className="alignment end-alignment">
          {(layout[2] as string[]).map((id: string) => childrenMap[id])}
        </div>
      </FlexLayout>
    );
  }
  return <div />;
};

export default AlignedRow;
