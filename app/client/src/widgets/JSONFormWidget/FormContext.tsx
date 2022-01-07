import React, { createContext } from "react";

import { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { RenderMode } from "constants/WidgetConstants";
import { JSONFormWidgetState } from "./widget";

type FormContextProps = React.PropsWithChildren<{
  executeAction: (actionPayload: ExecuteTriggerPayload) => void;
  renderMode: RenderMode;
  setFieldValidityState: (
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
  setFieldValidityState,
  updateWidgetMetaProperty,
  updateWidgetProperty,
}: FormContextProps) {
  return (
    <FormContext.Provider
      value={{
        executeAction,
        renderMode,
        setFieldValidityState,
        updateWidgetMetaProperty,
        updateWidgetProperty,
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

export default FormContext;
