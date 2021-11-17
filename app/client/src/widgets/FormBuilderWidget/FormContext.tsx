import React, { createContext } from "react";

import { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { RenderMode } from "constants/WidgetConstants";

type FormContextProps = React.PropsWithChildren<{
  executeAction: (actionPayload: ExecuteTriggerPayload) => void;
  renderMode: RenderMode;
  updateWidgetProperty: (propertyName: string, propertyValues: any) => void;
  updateWidgetMetaProperty: (propertName: string, propertyValue: any) => void;
}>;

const FormContext = createContext<FormContextProps>({} as FormContextProps);

export function FormContextProvider({
  children,
  executeAction,
  renderMode,
  updateWidgetMetaProperty,
  updateWidgetProperty,
}: FormContextProps) {
  return (
    <FormContext.Provider
      value={{
        executeAction,
        renderMode,
        updateWidgetProperty,
        updateWidgetMetaProperty,
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

export default FormContext;
