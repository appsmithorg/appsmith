import type { FieldEntityInformation } from "components/editorComponents/CodeEditor/EditorConfig";
import React, { createContext, useMemo } from "react";

interface InputsFormContextProps {
  evaluatedValues?: Record<string, unknown>;
  dataTreePathPrefix?: string;
  blockCompletions?: FieldEntityInformation["blockCompletions"];
}

type InputsFormContextProviderProps =
  React.PropsWithChildren<InputsFormContextProps>;

export const InputsFormContext = createContext<InputsFormContextProps>({});

export function InputsFormContextProvider({
  blockCompletions,
  children,
  dataTreePathPrefix,
  evaluatedValues,
}: InputsFormContextProviderProps) {
  const value = useMemo(
    () => ({
      blockCompletions,
      dataTreePathPrefix,
      evaluatedValues,
    }),
    [dataTreePathPrefix, evaluatedValues, blockCompletions],
  );

  return (
    <InputsFormContext.Provider value={value}>
      {children}
    </InputsFormContext.Provider>
  );
}
