import BaseWidget from "widgets/BaseWidget";
import { WidgetProps } from "./BaseWidget";
import React from "react";
import { useSelector } from "react-redux";
// import { MAIN_CONTAINER_WIDGET_ID } from "../constants/WidgetConstants";
import { getWidgetEvalValues } from "../selectors/dataTreeSelectors";
import { AppState } from "reducers/index";

export const withEvalTree = (WrappedWidget: typeof BaseWidget) => {
  return function Widget(props: WidgetProps) {
    const evaluatedWidget = useSelector((state: AppState) =>
      getWidgetEvalValues(state, props.widgetId),
    );
    // if (props.widgetId !== MAIN_CONTAINER_WIDGET_ID) {
    //   console.log("MAIN_CONTAINER_WIDGET_ID");
    // }

    // console.log({ props, evaluatedWidget });
    return <WrappedWidget {...props} {...evaluatedWidget} />;
  };
};
