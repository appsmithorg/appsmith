import React, { createContext, useContext } from "react";
import type {
  GitContextValue,
  UseGitContextValueParams,
} from "./hooks/useGitContextValue";
import useGitContextValue from "./hooks/useGitContextValue";

const gitContextInitialValue = {} as GitContextValue;

export const GitContext = createContext(gitContextInitialValue);

export const useGitContext = () => {
  return useContext(GitContext);
};

interface GitContextProviderProps extends UseGitContextValueParams {
  children: React.ReactNode;
  // extra
  // connectPermitted?: boolean;
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
