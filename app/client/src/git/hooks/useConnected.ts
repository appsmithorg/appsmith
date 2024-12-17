import { useGitContext } from "git/components/GitContextProvider";
import { selectConnected } from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useSelector } from "react-redux";

export default function useConnected() {
  const { artifactDef } = useGitContext();

  const isConnected = useSelector((state: GitRootState) => {
    return selectConnected(state, artifactDef);
  });

  return isConnected;
}
