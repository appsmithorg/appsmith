import useAritfactSelector from "git/hooks/useArtifactSelector";
import { selectDefaultBranch } from "git/store/selectors/gitSingleArtifactSelectors";

function useDefaultBranch() {
  const defaultBranch = useAritfactSelector(selectDefaultBranch);

  return {
    defaultBranch: defaultBranch ?? null,
  };
}

export default useDefaultBranch;
