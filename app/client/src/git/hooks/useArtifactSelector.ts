import { useGitContext } from "git/components/GitContextProvider";
import type { GitArtifactDef } from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useSelector } from "react-redux";
import type { Tail } from "redux-saga/effects";

/**
 * This hook is used to select data from the redux store based on the artifactDef.
 **/
export default function useAritfactSelector<
  // need any type to properly infer the return type
  /* eslint-disable @typescript-eslint/no-explicit-any */
  Fn extends (state: any, artifactDef: GitArtifactDef, ...args: any[]) => any,
>(selectorFn: Fn, ...args: Tail<Tail<Parameters<Fn>>>): ReturnType<Fn> | null {
  const { artifactDef } = useGitContext();

  return useSelector((state: GitRootState) => {
    if (typeof selectorFn !== "function" || !artifactDef) {
      return null;
    }

    const { artifactType, baseArtifactId } = artifactDef;

    if (!state.git?.artifacts?.[artifactType]?.[baseArtifactId]) {
      return null;
    }

    return selectorFn(state, artifactDef, ...args);
  });
}
