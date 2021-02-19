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
import {
  RenderModes,
  WidgetType,
  WidgetTypes,
} from "constants/WidgetConstants";
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

// const StickyRow = (props: {
//   data: ListChildComponentProps;
//   children: any[];
//   renderFn: (el: WidgetProps) => React.ReactNode;
//   rowHeight: number;
// }) => {
//   const child = props.children[props.data.index];
//   const row = props.renderFn(child);

//   return (
//     <div
//       style={{ height: `${props.rowHeight}px` }}
//       key={`virtualized-row-${props.data.index}`}
//       className="sticky"
//     >
//       {row}
//     </div>
//   );
// };

// const innerElementType = forwardRef<any, any>(({ children, ...rest }, ref) => (
//   <StickyListContext.Consumer>
//     {(props) => (
//       <div ref={ref} {...rest}>
//         {props?.stickyIndices.map((index: number) => (
//           <StickyRow
//             data={children}
//             index={index}
//             key={index}
//             style={{
//               left: 0,
//               width: "100%",
//             }}
//           />
//         ))}

//         {children}
//       </div>
//     )}
//   </StickyListContext.Consumer>
// ));

// innerElementType.displayName = "InnerElement";

// const StickyListContext = createContext<StickyListContextInterface | null>(
//   null,
// );
// StickyListContext.displayName = "StickyListContext";
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
    const padding = (CONTAINER_GRID_PADDING + WIDGET_PADDING) * 2;
    let width = componentWidth;
    if (!this.props.noPad) width -= padding;
    else width -= WIDGET_PADDING * 3;

    return {
      snapRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      snapColumnSpace: componentWidth
        ? width / GridDefaults.DEFAULT_GRID_COLUMNS
        : 0,
    };
  };

  renderChildWidget(childWidgetData: WidgetProps): React.ReactNode {
    // For now, isVisible prop defines whether to render a detached widget
    if (childWidgetData.detachFromLayout && !childWidgetData.isVisible) {
      return null;
    }

    const { componentWidth, componentHeight } = this.getComponentDimensions();

    childWidgetData.rightColumn = componentWidth;
    childWidgetData.bottomRow = this.props.shouldScrollContents
      ? childWidgetData.bottomRow
      : componentHeight;
    childWidgetData.minHeight = componentHeight;
    childWidgetData.isVisible = this.props.isVisible;
    childWidgetData.shouldScrollContents = false;
    childWidgetData.canExtend = this.props.shouldScrollContents;

    childWidgetData.parentId = this.props.widgetId;

    return WidgetFactory.createWidget(childWidgetData, this.props.renderMode);
  }

  renderChildren = () => {
    const isVirtualized = this.props.virtualizedEnabled;

    // if container is virtualized, render a virtualized list
    if (isVirtualized) {
      if (this.props.renderMode !== RenderModes.CANVAS) {
        return this.renderVirtualizedContainer();
      } else {
        return this.renderVirtualizedTemplate();
      }
    }

    return map(
      // sort by row so stacking context is correct
      // TODO(abhinav): This is hacky. The stacking context should increase for widgets rendered top to bottom, always.
      // Figure out a way in which the stacking context is consistent.
      sortBy(compact(this.props.children), (child) => child.topRow),
      this.renderChildWidget,
    );
  };

  renderVirtualizedTemplate = () => {
    const firstChild = get(this.props, "children[0]");
    return this.renderChildWidget(firstChild);
  };

  /**
   * creates a virtualized list component using react-window's VariableList
   *
   * @param props
   */
  renderVirtualizedContainer = () => {
    const { componentWidth } = this.getComponentDimensions();
    const snapSpaces = this.getSnapSpaces();
    const children = get(this.props, "children", []);
    const firstChild = get(this.props, "children[0]");
    const rowHeight = firstChild.bottomRow * snapSpaces.snapRowSpace;

    const Row = (childProps: ListChildComponentProps) => {
      const row = this.renderChildWidget(children[childProps.index]);

      return <>{row}</>;
    };

    const virtualizedContainerHeight =
      this.props.componentHeight || this.props.minHeight;

    const VirtualizedList = () => (
      <List
        height={virtualizedContainerHeight}
        itemCount={children.length}
        itemSize={rowHeight}
        width={componentWidth - 20}
        className="appsmith-virtualized-container"
      >
        {Row}
      </List>
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
  noPad?: boolean;
}

export default ContainerWidget;
export const ProfiledContainerWidget = Sentry.withProfiler(ContainerWidget);
