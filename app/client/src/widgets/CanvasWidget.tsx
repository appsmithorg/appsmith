/* eslint-disable no-console */
import {
  LayoutDirection,
  Positioning,
  ResponsiveBehavior,
} from "utils/autoLayout/constants";
import DropTargetComponent from "components/editorComponents/DropTargetComponent";
import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { RenderModes } from "constants/WidgetConstants";
import { AutoCanvasDraggingArena } from "pages/common/CanvasArenas/AutoLayoutArenas/AutoCanvasDraggingArena";
import { CanvasSelectionArena } from "pages/common/CanvasArenas/CanvasSelectionArena";
import WidgetsMultiSelectBox from "pages/Editor/WidgetsMultiSelectBox";
import type { CSSProperties } from "react";
import React from "react";
import { getCanvasClassName } from "utils/generators";
import type { DerivedPropertiesMap } from "utils/WidgetFactory";
import WidgetFactory from "utils/WidgetFactory";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import ContainerWidget from "widgets/ContainerWidget/widget";
import type { CanvasWidgetStructure, DSLWidget } from "./constants";
import ContainerComponent from "./ContainerWidget/component";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import type { AutocompletionDefinitions } from "widgets/constants";
import type { LayoutComponentProps } from "utils/autoLayout/autoLayoutTypes";
import { renderLayouts } from "utils/autoLayout/layoutComponentUtils";
import { isArray } from "lodash";
import FlexBoxComponent from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import { AutoLayoutDropTarget } from "components/editorComponents/AutoLayoutDropTarget";
import { FixedCanvasDraggingArena } from "pages/common/CanvasArenas/FixedArenas/FixedCanvasDraggingArena";

class CanvasWidget extends ContainerWidget {
  static getPropertyPaneConfig() {
    return [];
  }
  static getWidgetType() {
    return "CANVAS_WIDGET";
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {};
  }

  getCanvasProps(): DSLWidget & {
    minHeight: number;
    layout: LayoutComponentProps[];
  } {
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
      layout: this.props.layout || [],
    };
  }

  renderAsDropTarget() {
    if (this.props.layout) return this.renderLayoutPreset();
    const canvasProps = this.getCanvasProps();
    const { snapColumnSpace } = this.getSnapSpaces();
    return (
      <DropTargetComponent
        bottomRow={this.props.bottomRow}
        isListWidgetCanvas={this.props.isListWidgetCanvas}
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

  renderChildWidget(
    childWidgetData: CanvasWidgetStructure,
    index: number,
  ): React.ReactNode {
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
    childWidget.childIndex = index;
    childWidget.direction = this.getDirection();

    return WidgetFactory.createWidget(childWidget, this.props.renderMode);
  }

  renderAsContainerComponent(
    props: ContainerWidgetProps<WidgetProps>,
  ): JSX.Element {
    const direction = this.getDirection();
    const snapRows = getCanvasSnapRows(
      this.props.bottomRow,
      this.props.mobileBottomRow,
      this.props.isMobile,
      this.props.appPositioningType === AppPositioningTypes.AUTO,
    );

    const DraggingArena = this.props.useAutoLayout
      ? AutoCanvasDraggingArena
      : FixedCanvasDraggingArena;
    return (
      <ContainerComponent {...props}>
        {props.renderMode === RenderModes.CANVAS && (
          <>
            <DraggingArena
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
            {!this.props.useAutoLayout && (
              <CanvasSelectionArena
                {...this.getSnapSpaces()}
                canExtend={props.canExtend}
                dropDisabled={!!props.dropDisabled}
                parentId={props.parentId}
                snapRows={snapRows}
                widgetId={props.widgetId}
              />
            )}
          </>
        )}
        {this.props.useAutoLayout
          ? this.renderLayoutPreset()
          : this.renderFixedCanvas(props)}
      </ContainerComponent>
    );
  }

  renderFlexBoxCanvas() {
    const stretchFlexBox = !this.props.children || !this.props.children?.length;
    return (
      <FlexBoxComponent
        flexLayers={this.props.flexLayers || []}
        stretchHeight={stretchFlexBox}
        useAutoLayout={this.props.useAutoLayout || false}
        widgetId={this.props.widgetId}
      >
        {this.renderChildren()}
      </FlexBoxComponent>
    );
  }

  renderLayoutPreset() {
    const layout: LayoutComponentProps[] = this.props
      .layout as LayoutComponentProps[];
    if (!layout) return this.renderFlexBoxCanvas();
    const map: { [key: string]: any } = {};
    if (isArray(this.props.children)) {
      for (const child of this.props.children) {
        map[child.widgetId] = child;
      }
    }
    const snapRows = getCanvasSnapRows(
      this.props.bottomRow,
      this.props.mobileBottomRow,
      this.props.isMobile,
      this.props.appPositioningType === AppPositioningTypes.AUTO,
    );
    const containerProps = {
      ...this.getCanvasProps(),
      snapRows,
      snapSpaces: this.getSnapSpaces(),
    };
    return <>{renderLayouts(layout, map, containerProps)}</>;
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
    // const height = 0;
    // const snapRows = getCanvasSnapRows(
    //   this.props.bottomRow,
    //   this.props.mobileBottomRow,
    //   this.props.isMobile,
    //   this.props.appPositioningType === AppPositioningTypes.AUTO,
    // );
    // height = snapRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
    const style: CSSProperties = {
      width: "100%",
      // height: this.props.isListWidgetCanvas ? "auto" : `${height}px`,
      height: "auto",
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
    if (this.props.appPositioningType === AppPositioningTypes.AUTO) {
      if (this.props.layout) return this.renderLayoutPreset();
      return (
        <AutoLayoutDropTarget widgetId={this.props.widgetId}>
          {this.renderAsContainerComponent(this.getCanvasProps())}
        </AutoLayoutDropTarget>
      );
      // const isMainContainer = this.props.widgetId === MAIN_CONTAINER_WIDGET_ID;
      // const style: CSSProperties = {
      //   position: "relative",
      //   zIndex: 1,
      //   minHeight:
      //     isMainContainer
      //       ? "calc(100vh - 110px)"
      //       : undefined,
      // };
      // return (
      //   <div style={style}>
      //     {this.renderAsContainerComponent(this.getCanvasProps())}
      //   {isMainContainer && isDragging && draggedOn === props.widgetId && (
      //     <div style={{ height: "10px" }} />
      //   )}
      //   </div>
      // );
    }
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
  eagerRender: true,
  defaults: {
    rows: 0,
    columns: 0,
    widgetName: "Canvas",
    version: 1,
    detachFromLayout: true,
    flexLayers: [],
    responsiveBehavior: ResponsiveBehavior.Fill,
    minWidth: FILL_WIDGET_MIN_WIDTH,
  },
  properties: {
    derived: CanvasWidget.getDerivedPropertiesMap(),
    default: CanvasWidget.getDefaultPropertiesMap(),
    meta: CanvasWidget.getMetaPropertiesMap(),
    config: CanvasWidget.getPropertyPaneConfig(),
    autocompleteDefinitions: CanvasWidget.getAutocompleteDefinitions(),
  },
};

export default CanvasWidget;
