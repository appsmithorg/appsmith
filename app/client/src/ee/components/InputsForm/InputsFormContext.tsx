import React, { createContext, useMemo } from "react";

interface InputsFormContextProps {
  evaluatedValues?: Record<string, unknown>;
  dataTreePathPrefix?: string;
}

type InputsFormContextProviderProps =
  React.PropsWithChildren<InputsFormContextProps>;

export const InputsFormContext = createContext<InputsFormContextProps>({});

export function InputsFormContextProvider({
  children,
  dataTreePathPrefix,
  evaluatedValues,
}: InputsFormContextProviderProps) {
  const value = useMemo(
    () => ({
      evaluatedValues,
      dataTreePathPrefix,
    }),
    [dataTreePathPrefix, evaluatedValues],
  );

  return (
    <InputsFormContext.Provider value={value}>
      {children}
    </InputsFormContext.Provider>
  );
}
