import BaseWidget from "widgets/BaseWidget";
import { WidgetProps } from "./BaseWidget";
import React from "react";
import { useSelector } from "react-redux";
import { getWidgetEvalValues } from "selectors/dataTreeSelectors";
import { AppState } from "reducers/index";
import { DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import { getIsWidgetLoading } from "selectors/dataTreeSelectors";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import {
  createCanvasWidget,
  createLoadingWidget,
} from "selectors/editorSelectors";

export const withEvalTree = (WrappedWidget: typeof BaseWidget) => {
  return React.memo(function Widget(canvasWidget: FlattenedWidgetProps) {
    const evaluatedWidget: DataTreeWidget = useSelector(
      (state: AppState) => getWidgetEvalValues(state, canvasWidget.widgetName),
      (prev, next) => {
        return prev === next;
      },
    );

    const isLoading: boolean = useSelector(
      (state: AppState) => getIsWidgetLoading(state, canvasWidget.widgetName),
      (prev, next) => {
        return prev === next;
      },
    );

    let widgetProps: WidgetProps;

    if (evaluatedWidget) {
      widgetProps = createCanvasWidget(canvasWidget, evaluatedWidget);
    } else {
      widgetProps = createLoadingWidget(canvasWidget);
    }

    return <WrappedWidget {...widgetProps} isLoading={isLoading} />;
  });
};
