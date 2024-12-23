import useArtifactSelector from "git/hooks/useArtifactSelector";
import { selectDefaultBranch } from "git/store/selectors/gitSingleArtifactSelectors";

function useDefaultBranch() {
  const defaultBranch = useArtifactSelector(selectDefaultBranch);

  return {
    defaultBranch: defaultBranch ?? null,
  };
}

export default useDefaultBranch;
