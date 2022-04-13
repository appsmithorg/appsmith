import BaseWidget from "widgets/BaseWidget";
import { WidgetProps } from "./BaseWidget";
import React from "react";
import { useSelector } from "react-redux";
import {
  getWidgetEvalValues,
  getIsWidgetLoading,
} from "selectors/dataTreeSelectors";
import { AppState } from "reducers/index";
import { DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import { getWidgetCanvasValues } from "../selectors/entitiesSelector";
import {
  createCanvasWidget,
  createLoadingWidget,
} from "selectors/editorSelectors";

export const withWidgetProps = (WrappedWidget: typeof BaseWidget) => {
  return React.memo(function Widget(widgetStructure: {
    widgetId: string;
    widgetName: string;
    children?: string[];
    parentId?: string;
  }) {
    const canvasWidget = useSelector(
      (state: AppState) =>
        getWidgetCanvasValues(state, widgetStructure.widgetId),
      (prev, next) => {
        return prev === next;
      },
    );

    const evaluatedWidget: DataTreeWidget = useSelector(
      (state: AppState) =>
        getWidgetEvalValues(state, widgetStructure.widgetName),
      (prev, next) => {
        return prev === next;
      },
    );

    const isLoading: boolean = useSelector(
      (state: AppState) =>
        getIsWidgetLoading(state, widgetStructure.widgetName),
      (prev, next) => {
        return prev === next;
      },
    );

    let widgetProps = {
      ...widgetStructure,
      ...canvasWidget,
    };

    if (evaluatedWidget) {
      widgetProps = createCanvasWidget(
        widgetProps as WidgetProps,
        evaluatedWidget,
      );
    } else {
      widgetProps = createLoadingWidget(widgetProps as WidgetProps);
    }

    return <WrappedWidget {...widgetProps} isLoading={isLoading} />;
  });
};
