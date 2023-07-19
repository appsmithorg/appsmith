/* eslint-disable no-console */
import React from "react";
import type { LayoutComponentProps } from "utils/autoLayout/autoLayoutTypes";
import FlexLayout from "./FlexLayout";
import { getLayoutComponent } from "utils/autoLayout/layoutComponentUtils";
import { CanvasDraggingArena } from "pages/common/CanvasArenas/CanvasDraggingArena";
import { LayoutDirection } from "utils/autoLayout/constants";

const Column = (props: LayoutComponentProps) => {
  console.log("####", { props });
  const {
    childrenMap,
    isDropTarget,
    layoutId,
    layoutStyle,
    layoutType,
    rendersWidgets,
  } = props;
  if (rendersWidgets && childrenMap) {
    const layout: string[] = props.layout as string[];
    return (
      <FlexLayout flexDirection="column" {...(layoutStyle || {})}>
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
        {layout.map((id: string) => childrenMap[id])}
      </FlexLayout>
    );
  }
  const layout: LayoutComponentProps[] = props.layout as LayoutComponentProps[];
  return (
    <FlexLayout flexDirection="column" {...(layoutStyle || {})}>
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
      {layout.map((item: LayoutComponentProps, index: number) => {
        const Comp = getLayoutComponent(item.layoutType);
        return (
          <Comp
            childrenMap={childrenMap}
            containerProps={props.containerProps}
            key={index}
            {...item}
          />
        );
      })}
    </FlexLayout>
  );
};

export default Column;
