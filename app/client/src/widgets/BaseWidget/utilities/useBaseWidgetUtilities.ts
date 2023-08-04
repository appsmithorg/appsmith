import {
  BaseWidgetActions,
  useBaseWidgetActions,
} from "./actions/useBaseWidgetActions";
import {
  BaseWidgetAutoComplete,
  useBaseWidgetAutoComplete,
} from "./autoComplete/useBaseWidgetAutoComplete";
import {
  BaseWidgetDebugger,
  useBaseWidgetDebugger,
} from "./debugger/useBaseWidgetDebugger";
import {
  BaseWidgetDSLOperations,
  useBaseWidgetDSLOperations,
} from "./dslOpertions/useBaseWidgetDSLOperations";
import { BaseWidgetEval, useBaseWidgetEval } from "./eval/useBaseWidgetEval";
import {
  BaseWidgetPropertyPane,
  useBaseWidgetPropertyPane,
} from "./propertyPane/useBaseWidgetPropertyPane";
import {
  BaseWidgetTheming,
  useBaseWidgetTheming,
} from "./theming/useBaseWidgetTheming";
import type { BaseWidgetProps } from "../withBaseWidget";

export interface BaseWidgetUtilities
  extends BaseWidgetActions,
    BaseWidgetAutoComplete,
    BaseWidgetDSLOperations,
    BaseWidgetPropertyPane,
    BaseWidgetTheming,
    BaseWidgetDebugger,
    BaseWidgetEval {}

export const useBaseWidgetUtilities = (
  props: BaseWidgetProps,
): BaseWidgetUtilities => {
  const { widgetId, widgetName } = props;
  return {
    ...useBaseWidgetActions({ widgetId, widgetName }),
    ...useBaseWidgetAutoComplete(),
    ...useBaseWidgetDSLOperations({ widgetId }),
    ...useBaseWidgetPropertyPane(),
    ...useBaseWidgetDebugger(),
    ...useBaseWidgetTheming(),
    ...useBaseWidgetEval(),
  };
};
