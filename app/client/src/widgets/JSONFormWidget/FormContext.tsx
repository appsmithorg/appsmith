import React, { createContext, useMemo } from "react";

import { RenderMode } from "constants/WidgetConstants";
import { Action, JSONFormWidgetState } from "./widget";
import { DebouncedExecuteActionPayload } from "widgets/MetaHOC";

type FormContextProps<TValues = any> = React.PropsWithChildren<{
  executeAction: (action: Action) => void;
  renderMode: RenderMode;
  setMetaInternalFieldState: (
    updateCallback: (prevState: JSONFormWidgetState) => JSONFormWidgetState,
    afterUpdateAction?: DebouncedExecuteActionPayload,
  ) => void;
  updateWidgetMetaProperty: (propertyName: string, propertyValue: any) => void;
  updateWidgetProperty: (propertyName: string, propertyValues: any) => void;
  updateFormData: (values: TValues) => void;
}>;

type FormContextValueProps = Omit<FormContextProps, "children">;

const FormContext = createContext<FormContextValueProps>(
  {} as FormContextValueProps,
);

export function FormContextProvider({
  children,
  executeAction,
  renderMode,
  setMetaInternalFieldState,
  updateFormData,
  updateWidgetMetaProperty,
  updateWidgetProperty,
}: FormContextProps) {
  const value = useMemo(
    () => ({
      executeAction,
      renderMode,
      setMetaInternalFieldState,
      updateFormData,
      updateWidgetMetaProperty,
      updateWidgetProperty,
    }),
    [],
  );
  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export default FormContext;
