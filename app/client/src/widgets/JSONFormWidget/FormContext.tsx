import React, { createContext, useMemo } from "react";

import { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { RenderMode } from "constants/WidgetConstants";
import { JSONFormWidgetState } from "./widget";

type FormContextProps = React.PropsWithChildren<{
  executeAction: (actionPayload: ExecuteTriggerPayload) => void;
  renderMode: RenderMode;
  setMetaInternalFieldState: (
    cb: (prevState: JSONFormWidgetState) => JSONFormWidgetState,
  ) => void;
  updateWidgetMetaProperty: (propertyName: string, propertyValue: any) => void;
  updateWidgetProperty: (propertyName: string, propertyValues: any) => void;
}>;

const FormContext = createContext<FormContextProps>({} as FormContextProps);

export function FormContextProvider({
  children,
  executeAction,
  renderMode,
  setMetaInternalFieldState,
  updateWidgetMetaProperty,
  updateWidgetProperty,
}: FormContextProps) {
  const value = useMemo(
    () => ({
      executeAction,
      renderMode,
      setMetaInternalFieldState,
      updateWidgetMetaProperty,
      updateWidgetProperty,
    }),
    [],
  );
  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export default FormContext;
