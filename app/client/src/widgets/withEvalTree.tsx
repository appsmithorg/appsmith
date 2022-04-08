import BaseWidget from "widgets/BaseWidget";
import { WidgetProps } from "./BaseWidget";
import React from "react";
import { useSelector } from "react-redux";
import { find } from "lodash";
import { getDataTree } from "selectors/dataTreeSelectors";
import { DataTreeWidget } from "../entities/DataTree/dataTreeFactory";

export const withEvalTree = (WrappedWidget: typeof BaseWidget) => {
  return function Widget(props: WidgetProps) {
    const dataTree = useSelector(getDataTree);
    const evaluatedWidget = find(dataTree, {
      widgetId: props.widgetId,
    }) as DataTreeWidget;
    console.log({ props, evaluatedWidget });
    return <WrappedWidget {...props} {...evaluatedWidget} />;
  };
};
