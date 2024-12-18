import React, { createContext, useContext } from "react";
import useGitContextValue from "./hooks/useGitContextValue";
import type { UseGitContextValueParams } from "./hooks/useGitContextValue";
import type { GitContextValue } from "./hooks/useGitContextValue";

const gitContextInitialValue = {} as GitContextValue;

export const GitContext = createContext(gitContextInitialValue);

export const useGitContext = () => {
  return useContext(GitContext);
};

interface GitContextProviderProps extends UseGitContextValueParams {
  children: React.ReactNode;
}

export default function GitContextProvider({
  children,
  ...useContextValueParams
}: GitContextProviderProps) {
  const contextValue = useGitContextValue(useContextValueParams);

  return (
    <GitContext.Provider value={contextValue}>{children}</GitContext.Provider>
  );
}
