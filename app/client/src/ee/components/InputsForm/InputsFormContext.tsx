import React, { createContext, useMemo } from "react";

interface InputsFormContextProps {
  useWatchEvalPath?: (name: string) => any;
  dataTreePathPrefix?: string;
}

type InputsFormContextProviderProps =
  React.PropsWithChildren<InputsFormContextProps>;

export const InputsFormContext = createContext<InputsFormContextProps>({});

export function InputsFormContextProvider({
  children,
  dataTreePathPrefix,
  useWatchEvalPath,
}: InputsFormContextProviderProps) {
  const memoizedValue = useMemo(
    () => ({
      useWatchEvalPath,
    }),
    [useWatchEvalPath],
  );

  return (
    <InputsFormContext.Provider
      value={{
        dataTreePathPrefix,
        useWatchEvalPath: memoizedValue.useWatchEvalPath,
      }}
    >
      {children}
    </InputsFormContext.Provider>
  );
}
