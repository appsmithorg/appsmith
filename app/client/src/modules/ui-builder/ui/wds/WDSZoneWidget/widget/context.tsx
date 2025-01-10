import { useSelector } from "react-redux";
import { getCanvasWidgets } from "ee/selectors/entitiesSelector";
import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { WidgetProps } from "widgets/BaseWidget";
import { getDataTree } from "selectors/dataTreeSelectors";

interface WDSZoneWidgetContextType {
  isFormValid: boolean;
  onReset?: () => void;
}

const WDSZoneWidgetContext = createContext<
  WDSZoneWidgetContextType | undefined
>(undefined);

export const useWDSZoneWidgetContext = () => {
  const context = useContext(WDSZoneWidgetContext);

  if (context === undefined) {
    throw new Error(
      "useWDSZoneWidgetContext must be used within a WDSZoneWidgetProvider",
    );
  }

  return context;
};

export const WDSZoneWidgetContextProvider = (props: {
  children: ReactNode;
  widget: WidgetProps;
  useAsForm?: boolean;
  onReset?: () => void;
}) => {
  const { onReset, useAsForm, widget } = props;
  const canvasWidgets = useSelector(getCanvasWidgets);
  const dataTree = useSelector(getDataTree);
  const isFormValid = useMemo(() => {
    if (!useAsForm) return true;

    const children = widget.children as WidgetProps["children"];

    return children.reduce((isValid: boolean, child: WidgetProps) => {
      const widget = dataTree[canvasWidgets[child.widgetId].widgetName];

      return "isValid" in widget ? widget.isValid && isValid : isValid;
    }, true);
  }, [widget, canvasWidgets, dataTree, useAsForm]);

  return (
    <WDSZoneWidgetContext.Provider value={{ isFormValid, onReset }}>
      {props.children}
    </WDSZoneWidgetContext.Provider>
  );
};

export default WDSZoneWidgetContext;
