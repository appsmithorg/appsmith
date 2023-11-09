import React, { createContext, useMemo } from "react";

interface InputsFormContextProps {
  useWatchEvalPath?: (name: string) => any;
}

type InputsFormContextProviderProps =
  React.PropsWithChildren<InputsFormContextProps>;

export const InputsFormContext = createContext<InputsFormContextProps>({});

export function InputsFormContextProvider({
  children,
  useWatchEvalPath,
}: InputsFormContextProviderProps) {
  const value = useMemo(
    () => ({
      useWatchEvalPath,
    }),
    [useWatchEvalPath],
  );

  return (
    <InputsFormContext.Provider value={value}>
      {children}
    </InputsFormContext.Provider>
  );
}
