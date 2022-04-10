import BaseWidget from "widgets/BaseWidget";
import { WidgetProps } from "./BaseWidget";
import React from "react";
import { useSelector } from "react-redux";
import { WIDGET_STATIC_PROPS } from "constants/WidgetConstants";
import { getWidgetEvalValues } from "selectors/dataTreeSelectors";
import { AppState } from "reducers/index";
import { DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import pick from "lodash/pick";
import isEqual from "lodash/isEqual";

export const withEvalTree = (WrappedWidget: typeof BaseWidget) => {
  return React.memo(function Widget(props: WidgetProps) {
    const evaluatedWidget: DataTreeWidget = useSelector(
      (state: AppState) => getWidgetEvalValues(state, props.widgetName),
      (prev, next) => {
        return isEqual(prev, next);
      },
    );

    const widgetStaticProps = pick(props, Object.keys(WIDGET_STATIC_PROPS));
    const widgetProps = {
      ...evaluatedWidget,
      ...widgetStaticProps,
    };

    return <WrappedWidget {...widgetProps} />;
  });
};
