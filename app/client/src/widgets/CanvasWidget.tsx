import {
  LayoutDirection,
  Overflow,
  Positioning,
} from "utils/autoLayout/constants";
import FlexBoxComponent from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import DropTargetComponent from "components/editorComponents/DropTargetComponent";
import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { GridDefaults, RenderModes } from "constants/WidgetConstants";
import { CanvasDraggingArena } from "pages/common/CanvasArenas/CanvasDraggingArena";
import { CanvasSelectionArena } from "pages/common/CanvasArenas/CanvasSelectionArena";
import WidgetsMultiSelectBox from "pages/Editor/WidgetsMultiSelectBox";
import React, { CSSProperties } from "react";
import { getCanvasClassName } from "utils/generators";
import { getDefaultResponsiveBehavior } from "utils/layoutPropertiesUtils";
import WidgetFactory, { DerivedPropertiesMap } from "utils/WidgetFactory";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import { WidgetProps } from "widgets/BaseWidget";
import ContainerWidget, {
  ContainerWidgetProps,
} from "widgets/ContainerWidget/widget";
import { CanvasWidgetStructure, DSLWidget } from "./constants";
import ContainerComponent from "./ContainerWidget/component";

class CanvasWidget extends ContainerWidget {
  static getPropertyPaneConfig() {
    return [];
  }
  static getWidgetType() {
    return "CANVAS_WIDGET";
  }
  componentDidMount(): void {
    super.componentDidMount();
  }

  getCanvasProps(): DSLWidget & { minHeight: number } {
    return {
      ...this.props,
      parentRowSpace: 1,
      parentColumnSpace: 1,
      topRow: 0,
      leftColumn: 0,
      containerStyle: "none",
      detachFromLayout: true,
      minHeight: this.props.minHeight || CANVAS_DEFAULT_MIN_HEIGHT_PX,
      shouldScrollContents: false,
    };
  }

  renderAsDropTarget() {
    const canvasProps = this.getCanvasProps();
    const { snapColumnSpace } = this.getSnapSpaces();
    return (
      <DropTargetComponent
        bottomRow={this.props.bottomRow}
        isMobile={this.props.isMobile}
        minHeight={this.props.minHeight || CANVAS_DEFAULT_MIN_HEIGHT_PX}
        mobileBottomRow={this.props.mobileBottomRow}
        noPad={this.props.noPad}
        parentId={this.props.parentId}
        snapColumnSpace={snapColumnSpace}
        useAutoLayout={this.props.useAutoLayout}
        widgetId={this.props.widgetId}
      >
        {this.renderAsContainerComponent(canvasProps)}
      </DropTargetComponent>
    );
  }

  renderChildWidget(childWidgetData: CanvasWidgetStructure): React.ReactNode {
    if (!childWidgetData) return null;

    const childWidget = { ...childWidgetData };

    const snapSpaces = this.getSnapSpaces();
    childWidget.parentColumnSpace = snapSpaces.snapColumnSpace;
    childWidget.parentRowSpace = snapSpaces.snapRowSpace;
    if (this.props.noPad) childWidget.noContainerOffset = true;
    childWidget.parentId = this.props.widgetId;
    // Pass layout controls to children
    childWidget.positioning =
      childWidget?.positioning || this.props.positioning;
    childWidget.isFlexChild = this.props.useAutoLayout;
    childWidget.direction = this.getDirection();

    return WidgetFactory.createWidget(childWidget, this.props.renderMode);
  }

  renderAsContainerComponent(
    props: ContainerWidgetProps<WidgetProps>,
  ): JSX.Element {
    const direction = this.getDirection();
    const snapRows = getCanvasSnapRows(props.bottomRow, props.canExtend);
    return (
      <ContainerComponent {...props}>
        {props.renderMode === RenderModes.CANVAS && (
          <>
            <CanvasDraggingArena
              {...this.getSnapSpaces()}
              alignItems={props.alignItems}
              canExtend={props.canExtend}
              direction={direction}
              dropDisabled={!!props.dropDisabled}
              noPad={this.props.noPad}
              parentId={props.parentId}
              snapRows={snapRows}
              useAutoLayout={this.props.useAutoLayout}
              widgetId={props.widgetId}
              widgetName={props.widgetName}
            />
            <CanvasSelectionArena
              {...this.getSnapSpaces()}
              canExtend={props.canExtend}
              dropDisabled={!!props.dropDisabled}
              parentId={props.parentId}
              snapRows={snapRows}
              widgetId={props.widgetId}
            />
          </>
        )}
        {this.props.useAutoLayout
          ? this.renderFlexCanvas(direction)
          : this.renderFixedCanvas(props)}
      </ContainerComponent>
    );
  }

  renderFlexCanvas(direction: LayoutDirection) {
    const stretchFlexBox = !this.props.children || !this.props.children?.length;
    return (
      <FlexBoxComponent
        direction={direction}
        flexLayers={this.props.flexLayers || []}
        isMobile={this.props.isMobile}
        overflow={
          direction === LayoutDirection.Horizontal
            ? Overflow.Wrap
            : Overflow.NoWrap
        }
        stretchHeight={stretchFlexBox}
        useAutoLayout={this.props.useAutoLayout || false}
        widgetId={this.props.widgetId}
      >
        {this.renderChildren()}
      </FlexBoxComponent>
    );
  }

  renderFixedCanvas(props: ContainerWidgetProps<WidgetProps>) {
    return (
      <>
        <WidgetsMultiSelectBox
          {...this.getSnapSpaces()}
          noContainerOffset={!!props.noContainerOffset}
          widgetId={this.props.widgetId}
          widgetType={this.props.type}
        />
        {this.renderChildren()}
      </>
    );
  }

  getDirection(): LayoutDirection {
    return this.props.positioning === Positioning.Vertical
      ? LayoutDirection.Vertical
      : LayoutDirection.Horizontal;
  }

  getPageView() {
    let height = 0;
    const snapRows = getCanvasSnapRows(this.props.bottomRow);
    height = snapRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
    const style: CSSProperties = {
      width: "100%",
      height: this.props.useAutoLayout ? "100%" : `${height}px`,
      background: "none",
      position: "relative",
    };
    // This div is the DropTargetComponent alternative for the page view
    // DropTargetComponent and this div are responsible for the canvas height
    return (
      <div className={getCanvasClassName()} style={style}>
        {this.renderAsContainerComponent(this.getCanvasProps())}
      </div>
    );
  }

  getCanvasView() {
    if (!this.props.dropDisabled) {
      return this.renderAsDropTarget();
    }
    return this.getPageView();
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }
  // TODO Find a way to enforce this, (dont let it be set)
  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }
}

export const CONFIG = {
  type: CanvasWidget.getWidgetType(),
  name: "Canvas",
  hideCard: true,
  defaults: {
    rows: 0,
    columns: 0,
    widgetName: "Canvas",
    version: 1,
    detachFromLayout: true,
    flexLayers: [],
    responsiveBehavior: getDefaultResponsiveBehavior(
      CanvasWidget.getWidgetType(),
    ),
    minWidth: FILL_WIDGET_MIN_WIDTH,
  },
  properties: {
    derived: CanvasWidget.getDerivedPropertiesMap(),
    default: CanvasWidget.getDefaultPropertiesMap(),
    meta: CanvasWidget.getMetaPropertiesMap(),
    config: CanvasWidget.getPropertyPaneConfig(),
  },
};

export default CanvasWidget;
