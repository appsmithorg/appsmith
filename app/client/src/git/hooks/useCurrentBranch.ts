import { selectCurrentBranch } from "git/store/selectors/gitArtifactSelectors";
import useArtifactSelector from "./useArtifactSelector";

export default function useCurrentBranch() {
  const currentBranch = useArtifactSelector(selectCurrentBranch);

  return currentBranch;
}
