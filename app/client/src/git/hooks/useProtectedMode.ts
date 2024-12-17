import { useGitContext } from "git/components/GitContextProvider";
import { selectProtectedMode } from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useSelector } from "react-redux";

export default function useProtectedMode() {
  const { artifactDef } = useGitContext();

  const isProtectedMode = useSelector((state: GitRootState) => {
    return selectProtectedMode(state, artifactDef);
  });

  return isProtectedMode;
}
