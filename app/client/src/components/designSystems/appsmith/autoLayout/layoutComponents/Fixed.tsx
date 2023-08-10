/* eslint-disable no-console */
import React from "react";

import { RenderModes } from "constants/WidgetConstants";
import { CanvasDraggingArena } from "pages/common/CanvasArenas/CanvasDraggingArena";
import { CanvasSelectionArena } from "pages/common/CanvasArenas/CanvasSelectionArena";
import type { LayoutComponentProps } from "utils/autoLayout/autoLayoutTypes";
import ContainerComponent from "widgets/ContainerWidget/component";
import { LayoutDirection } from "utils/autoLayout/constants";
import WidgetsMultiSelectBox from "pages/Editor/WidgetsMultiSelectBox";
import DropTargetComponent from "components/editorComponents/DropTargetComponent";
import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import { getCanvasClassName } from "utils/generators";
import { renderChildWidget } from "utils/autoLayout/layoutComponentUtils";

const Fixed = (props: LayoutComponentProps) => {
  const { childrenMap, containerProps, layoutId, layoutType } = props;
  if (!containerProps) return null;
  const renderAsContainerComponent = () => {
    return (
      <ContainerComponent {...containerProps}>
        {containerProps.renderMode === RenderModes.CANVAS && (
          <>
            <CanvasDraggingArena
              {...containerProps.snapSpaces}
              alignItems={containerProps.alignItems}
              canExtend={containerProps.canExtend}
              direction={
                layoutType.includes("ROW")
                  ? LayoutDirection.Horizontal
                  : LayoutDirection.Vertical
              }
              dropDisabled={!!containerProps.dropDisabled}
              noPad={containerProps.noPad}
              parentId={containerProps.parentId}
              snapRows={containerProps.snapRows}
              useAutoLayout={false}
              widgetId={containerProps.widgetId}
              widgetName={containerProps.widgetName}
            />
            <CanvasSelectionArena
              {...containerProps.snapSpaces}
              canExtend={containerProps.canExtend}
              dropDisabled={!!containerProps.dropDisabled}
              parentId={containerProps.parentId}
              snapRows={containerProps.snapRows}
              widgetId={containerProps.widgetId}
            />
          </>
        )}
        <>
          <WidgetsMultiSelectBox
            {...containerProps.snapSpaces}
            noContainerOffset={!!containerProps.noContainerOffset}
            widgetId={containerProps.widgetId}
            widgetType={containerProps.type}
          />
          {childrenMap
            ? Object.keys(childrenMap).map((id: string) =>
                renderChildWidget(childrenMap[id], layoutId, containerProps),
              )
            : null}
        </>
      </ContainerComponent>
    );
  };
  return containerProps.renderMode === RenderModes.CANVAS ? (
    <DropTargetComponent
      bottomRow={containerProps.bottomRow}
      isListWidgetCanvas={containerProps.isListWidgetCanvas}
      isMobile={containerProps.isMobile}
      minHeight={containerProps.minHeight || CANVAS_DEFAULT_MIN_HEIGHT_PX}
      mobileBottomRow={containerProps.mobileBottomRow}
      noPad={containerProps.noPad}
      parentId={containerProps.parentId}
      snapColumnSpace={containerProps.snapSpaces.snapColumnSpace}
      useAutoLayout={false}
      widgetId={containerProps.widgetId}
    >
      {renderAsContainerComponent()}
    </DropTargetComponent>
  ) : (
    <div
      className={getCanvasClassName()}
      style={{
        width: "100%",
        height: "auto",
        background: "none",
        position: "relative",
      }}
    >
      {renderAsContainerComponent()}
    </div>
  );
};

export default Fixed;
