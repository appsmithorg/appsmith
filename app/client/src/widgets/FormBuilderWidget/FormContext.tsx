import React, { createContext } from "react";

import { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { RenderMode } from "constants/WidgetConstants";

type FormContextProps = React.PropsWithChildren<{
  executeAction: (actionPayload: ExecuteTriggerPayload) => void;
  renderMode: RenderMode;
  updateWidgetProperty: (propertyName: string, propertyValues: any) => void;
}>;

const FormContext = createContext<FormContextProps>({} as FormContextProps);

export function FormContextProvider({
  children,
  executeAction,
  renderMode,
  updateWidgetProperty,
}: FormContextProps) {
  return (
    <FormContext.Provider
      value={{
        executeAction,
        renderMode,
        updateWidgetProperty,
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

export default FormContext;
