import React, { CSSProperties } from "react";
import { WidgetProps } from "widgets/BaseWidget";
import {
  ContainerWidget,
  ContainerWidgetProps,
} from "widgets/ContainerWidget/widget";
import { GridDefaults, RenderModes } from "constants/WidgetConstants";
import DropTargetComponent from "components/editorComponents/DropTargetComponent";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import { getCanvasClassName } from "utils/generators";
import WidgetFactory, { DerivedPropertiesMap } from "utils/WidgetFactory";
import { CanvasWidgetStructure } from "./constants";
import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import {
  AlignItems,
  Alignment,
  JustifyContent,
  LayoutDirection,
  Overflow,
  Positioning,
  ResponsiveBehavior,
  Spacing,
} from "components/constants";
import ContainerComponent, { FlexBox } from "./ContainerWidget/component";
import { CanvasDraggingArena } from "pages/common/CanvasArenas/CanvasDraggingArena";
import { CanvasSelectionArena } from "pages/common/CanvasArenas/CanvasSelectionArena";
import WidgetsMultiSelectBox from "pages/Editor/WidgetsMultiSelectBox";
import { AutoLayoutContext } from "utils/autoLayoutContext";

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

  getCanvasProps(): ContainerWidgetProps<WidgetProps> {
    return {
      ...this.props,
      parentRowSpace: 1,
      parentColumnSpace: 1,
      topRow: 0,
      leftColumn: 0,
      containerStyle: "none",
      detachFromLayout: true,
    };
  }

  renderAsDropTarget() {
    const canvasProps = this.getCanvasProps();
    return (
      <DropTargetComponent
        {...canvasProps}
        {...this.getSnapSpaces()}
        minHeight={this.props.minHeight || CANVAS_DEFAULT_MIN_HEIGHT_PX}
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
    childWidget.useAutoLayout = this.props.useAutoLayout;
    childWidget.direction = this.props.direction;
    childWidget.justifyContent = this.props.justifyContent;
    childWidget.alignItems = this.props.alignItems;

    return WidgetFactory.createWidget(childWidget, this.props.renderMode);
  }

  renderAsContainerComponent(
    props: ContainerWidgetProps<WidgetProps>,
  ): JSX.Element {
    const snapRows = getCanvasSnapRows(props.bottomRow, props.canExtend);
    const stretchFlexBox =
      !this.props.children || !this.props.children?.length
        ? true
        : this.props.alignment === Alignment.Bottom ||
          this.props.positioning === Positioning.Vertical;
    return (
      <ContainerComponent {...props}>
        {props.renderMode === RenderModes.CANVAS && (
          <>
            <CanvasDraggingArena
              {...this.getSnapSpaces()}
              alignItems={props.alignItems}
              canExtend={props.canExtend}
              direction={this.props.direction}
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
        <WidgetsMultiSelectBox
          {...this.getSnapSpaces()}
          noContainerOffset={!!props.noContainerOffset}
          widgetId={this.props.widgetId}
          widgetType={this.props.type}
        />
        {/* without the wrapping div onClick events are triggered twice */}
        <FlexBox
          alignment={this.props.alignment || Alignment.Left}
          direction={this.props.direction || LayoutDirection.Vertical}
          overflow={Overflow.NoWrap}
          spacing={this.props.spacing || Spacing.None}
          stretchHeight={stretchFlexBox}
          useAutoLayout={this.props.useAutoLayout || false}
          widgetId={this.props.widgetId}
        >
          <AutoLayoutContext.Provider
            value={{
              useAutoLayout: true,
              direction: LayoutDirection.Vertical,
              justifyContent: JustifyContent.FlexStart,
              alignItems: AlignItems.FlexStart,
              overflow:
                props.widgetName === "MainContainer"
                  ? Overflow.Auto
                  : Overflow.NoWrap,
            }}
          >
            {this.renderChildren()}
          </AutoLayoutContext.Provider>
        </FlexBox>
      </ContainerComponent>
    );
  }

  getPageView() {
    let height = 0;
    const snapRows = getCanvasSnapRows(
      this.props.bottomRow,
      this.props.canExtend,
    );
    height = snapRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

    const style: CSSProperties = {
      width: "100%",
      height: `${height}px`,
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
  },
  properties: {
    derived: CanvasWidget.getDerivedPropertiesMap(),
    default: CanvasWidget.getDefaultPropertiesMap(),
    meta: CanvasWidget.getMetaPropertiesMap(),
    config: CanvasWidget.getPropertyPaneConfig(),
  },
};

export default CanvasWidget;
