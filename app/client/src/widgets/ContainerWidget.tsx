import React, { createContext, forwardRef } from "react";
import { map, sortBy, compact, get } from "lodash";
import {
  ListChildComponentProps,
  FixedSizeList as List,
  FixedSizeListProps as ListProps,
} from "react-window";

import ContainerComponent, {
  ContainerStyle,
} from "components/designSystems/appsmith/ContainerComponent";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import WidgetFactory from "utils/WidgetFactory";
import {
  GridDefaults,
  CONTAINER_GRID_PADDING,
  WIDGET_PADDING,
} from "constants/WidgetConstants";

import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import * as Sentry from "@sentry/react";

export interface StickyListContextInterface {
  stickyIndices: number[];
  ItemRenderer: any;
}

const StickyListContext = createContext<StickyListContextInterface | null>(
  null,
);
StickyListContext.displayName = "StickyListContext";
class ContainerWidget extends BaseWidget<
  ContainerWidgetProps<WidgetProps>,
  WidgetState
> {
  constructor(props: ContainerWidgetProps<WidgetProps>) {
    super(props);
    this.renderChildWidget = this.renderChildWidget.bind(this);
  }

  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Use a html color name, HEX, RGB or RGBA value",
            placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
            propertyName: "backgroundColor",
            label: "Background Color",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "shouldScrollContents",
            label: "Scroll Contents",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
        ],
      },
    ];
  }

  getSnapSpaces = () => {
    const { componentWidth } = this.getComponentDimensions();
    return {
      snapRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      snapColumnSpace: componentWidth
        ? (componentWidth - (CONTAINER_GRID_PADDING + WIDGET_PADDING) * 2) /
          GridDefaults.DEFAULT_GRID_COLUMNS
        : 0,
    };
  };

  renderChildWidget(childWidgetData: WidgetProps): React.ReactNode {
    // For now, isVisible prop defines whether to render a detached widget
    if (childWidgetData.detachFromLayout && !childWidgetData.isVisible) {
      return null;
    }

    const snapSpaces = this.getSnapSpaces();
    const { componentWidth, componentHeight } = this.getComponentDimensions();

    if (childWidgetData.type !== WidgetTypes.CANVAS_WIDGET) {
      // This path will exist IF CURRENT WIDGET IS CANVAS_WIDGET
      childWidgetData.parentColumnSpace = snapSpaces.snapColumnSpace;
      childWidgetData.parentRowSpace = snapSpaces.snapRowSpace;
    } else {
      // This is for the detached child like the default CANVAS_WIDGET child

      childWidgetData.rightColumn = componentWidth;
      childWidgetData.bottomRow = this.props.shouldScrollContents
        ? childWidgetData.bottomRow
        : componentHeight;
      childWidgetData.minHeight = componentHeight;
      childWidgetData.isVisible = this.props.isVisible;
      childWidgetData.shouldScrollContents = false;
      childWidgetData.canExtend = this.props.shouldScrollContents;
    }

    console.log({ bottomRow: childWidgetData.bottomRow });

    childWidgetData.parentId = this.props.widgetId;

    return WidgetFactory.createWidget(childWidgetData, this.props.renderMode);
  }

  renderChildren = () => {
    const isVirtualized = this.props.virtualizedEnabled;

    // if container is virtualized, render a virtualized list
    if (isVirtualized) {
      return this.renderVirtualizedContainer();
    }

    return map(
      // sort by row so stacking context is correct
      // TODO(abhinav): This is hacky. The stacking context should increase for widgets rendered top to bottom, always.
      // Figure out a way in which the stacking context is consistent.
      sortBy(compact(this.props.children), (child) => child.topRow),
      this.renderChildWidget,
    );
  };

  /**
   * creates a virtualized list component using react-window's VariableList
   *
   * @param props
   */
  renderVirtualizedContainer = () => {
    const { componentWidth, componentHeight } = this.getComponentDimensions();
    const snapSpaces = this.getSnapSpaces();
    const sortedChildren = sortBy(
      compact(this.props.children),
      (child) => child.topRow,
    );

    const rowHeight = sortedChildren[0].bottomRow * snapSpaces.snapRowSpace;

    // eslint-disable-next-line
    const innerElementType = forwardRef<any, any>(
      ({ children, ...rest }, ref) => (
        <StickyListContext.Consumer>
          {(props) => (
            <div ref={ref} {...rest}>
              {props?.stickyIndices.map((index: number) => (
                <StickyRow
                  data={this.props.children}
                  index={index}
                  key={index}
                  style={{
                    left: 0,
                    width: "100%",
                  }}
                />
              ))}

              {children}
            </div>
          )}
        </StickyListContext.Consumer>
      ),
    );

    const StickyRow = (childProps: ListChildComponentProps) => {
      const child = sortedChildren[childProps.index];
      const row = this.renderChildWidget(child);

      return (
        <div
          style={{ height: `${rowHeight}px` }}
          key={`virtualized-row-${childProps.index}`}
          className="sticky"
        >
          {row}
        </div>
      );
    };

    const Row = (childProps: ListChildComponentProps) => {
      const row = this.renderChildWidget(sortedChildren[childProps.index]);

      return <div key={`virtualized-row-${childProps.index}`}>{row}</div>;
    };

    const ItemWrapper = (childProps: ListChildComponentProps) => {
      const { ItemRenderer, stickyIndices } = childProps.data;
      if (stickyIndices && stickyIndices.includes(childProps.index)) {
        return null;
      }
      return <ItemRenderer index={childProps.index} style={childProps.style} />;
    };

    const StickyList = (listProps: ListProps & { stickyIndices: number[] }) => {
      const { children, stickyIndices, ...rest } = listProps;

      return (
        <StickyListContext.Provider
          value={{ ItemRenderer: children, stickyIndices }}
        >
          <List
            itemData={{ ItemRenderer: listProps.children, stickyIndices }}
            {...rest}
          >
            {ItemWrapper}
          </List>
        </StickyListContext.Provider>
      );
    };

    const VirtualizedList = () => (
      <StickyList
        height={this.props.minHeight || componentHeight}
        itemCount={sortedChildren.length}
        itemSize={rowHeight}
        width={componentWidth}
        innerElementType={innerElementType}
        stickyIndices={[0]}
        className="appsmith-virtualized-container"
      >
        {Row}
      </StickyList>
    );

    return <VirtualizedList />;
  };

  renderAsContainerComponent(props: ContainerWidgetProps<WidgetProps>) {
    return (
      <ContainerComponent {...props}>
        {this.renderChildren()}
      </ContainerComponent>
    );
  }

  getPageView() {
    return this.renderAsContainerComponent(this.props);
  }

  getWidgetType(): WidgetType {
    return WidgetTypes.CONTAINER_WIDGET;
  }
}

export interface ContainerWidgetProps<T extends WidgetProps>
  extends WidgetProps {
  children?: T[];
  containerStyle?: ContainerStyle;
  shouldScrollContents?: boolean;
}

export default ContainerWidget;
export const ProfiledContainerWidget = Sentry.withProfiler(ContainerWidget);
