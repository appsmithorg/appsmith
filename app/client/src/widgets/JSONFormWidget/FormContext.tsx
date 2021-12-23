import React, { createContext } from "react";

import { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { RenderMode } from "constants/WidgetConstants";

type FormContextProps = React.PropsWithChildren<{
  executeAction: (actionPayload: ExecuteTriggerPayload) => void;
  renderMode: RenderMode;
  updateWidgetProperty: (propertyName: string, propertyValues: any) => void;
  updateWidgetMetaProperty: (propertyName: string, propertyValue: any) => void;
  fieldState: Record<string, any>;
}>;

const FormContext = createContext<FormContextProps>({} as FormContextProps);

export function FormContextProvider({
  children,
  executeAction,
  fieldState,
  renderMode,
  updateWidgetMetaProperty,
  updateWidgetProperty,
}: FormContextProps) {
  return (
    <FormContext.Provider
      value={{
        executeAction,
        fieldState,
        renderMode,
        updateWidgetMetaProperty,
        updateWidgetProperty,
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

export default FormContext;
