import React, { createContext, useMemo } from "react";

import type { RenderMode } from "constants/WidgetConstants";
import type { Action, JSONFormWidgetState } from "./widget";
import type { DebouncedExecuteActionPayload } from "widgets/MetaHOC";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormContextProps<TValues = any> = React.PropsWithChildren<{
  executeAction: (action: Action) => void;
  renderMode: RenderMode;
  setMetaInternalFieldState: (
    updateCallback: (prevState: JSONFormWidgetState) => JSONFormWidgetState,
    afterUpdateAction?: DebouncedExecuteActionPayload,
  ) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateWidgetMetaProperty: (propertyName: string, propertyValue: any) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
