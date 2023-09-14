import type { RenderModes } from "constants/WidgetConstants";
import { map } from "lodash";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import WidgetFactory from "WidgetProvider/factory";
import type { WidgetProps } from "widgets/BaseWidget";

function renderChildWidget(
  props: {
    childWidgetData: WidgetProps;
    shouldScrollContents: boolean;
    widgetId: string;
    renderMode: RenderModes;
    componentDimensions: { componentWidth: number; componentHeight: number };
    layoutSystemProps?: any;
  },
  index = 0,
): React.ReactNode {
  const {
    childWidgetData,
    componentDimensions,
    renderMode,
    shouldScrollContents,
    widgetId,
    layoutSystemProps = {},
  } = props;
  const childWidget = { ...childWidgetData, ...layoutSystemProps };
  const { componentHeight, componentWidth } = componentDimensions;
  childWidget.rightColumn = componentWidth;
  childWidget.bottomRow = shouldScrollContents
    ? childWidget.bottomRow
    : componentHeight;
  childWidget.minHeight = componentHeight;
  childWidget.shouldScrollContents = false;
  childWidget.canExtend = shouldScrollContents;
  childWidget.parentId = widgetId;
  childWidget.childIndex = index;
  // Pass layout controls to children
  childWidget.positioning = AppPositioningTypes.AUTO;
  return WidgetFactory.createWidget(childWidget, renderMode);
}

export const renderChildren = (
  children: any,
  shouldScrollContents: boolean,
  widgetId: string,
  renderMode: RenderModes,
  componentDimensions: { componentWidth: number; componentHeight: number },
  layoutSystemProps = {},
): React.ReactNode[] => {
  return map(children, (childWidgetData: WidgetProps, index: number) =>
    renderChildWidget(
      {
        childWidgetData,
        renderMode,
        shouldScrollContents,
        widgetId,
        componentDimensions,
        layoutSystemProps,
      },
      index,
    ),
  );
};
