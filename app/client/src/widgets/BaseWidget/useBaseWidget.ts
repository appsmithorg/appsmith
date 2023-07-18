// static getPropertyPaneConfig(): PropertyPaneConfig[] {
//     return [];
//   }

import type { ReactNode } from "react";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { useBaseWidgetActions } from "./actions/useBaseWidgetActions";
import { useBaseWidgetAutoComplete } from "./autoComplete/useBaseWidgetAutoComplete";
import { useBaseWidgetDebugger } from "./debugger/useBaseWidgetDebugger";
import { useBaseWidgetDSLOperations } from "./dslOpertions/useBaseWidgetDSLOperations";
import { useBaseWidgetPropertyPane } from "./propertyPane/useBaseWidgetPropertyPane";
import { useBaseWidgetRender } from "./render/useBaseWidgetRender";
import { useBaseWidgetTheming } from "./theming/useBaseWidgetTheming";

interface BaseWidgetProps extends WidgetProps, WidgetState {}

export const useBaseWidget = (props: BaseWidgetProps, content: ReactNode) => {
  const { widgetId, widgetName, appPositioningType } = props;
  return {
    ...useBaseWidgetActions({ widgetId, widgetName }),
    ...useBaseWidgetAutoComplete(),
    ...useBaseWidgetDSLOperations({ widgetId }),
    ...useBaseWidgetPropertyPane(),
    ...useBaseWidgetTheming(),
    ...useBaseWidgetRender({ appPositioningType }),
  };
};
