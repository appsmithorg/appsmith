import { useGitContext } from "git/components/GitContextProvider";
import { selectMetadataState } from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useSelector } from "react-redux";

export default function useMetadata() {
  const { artifactDef } = useGitContext();

  const metadataState = useSelector((state: GitRootState) =>
    selectMetadataState(state, artifactDef),
  );

  return {
    metadata: metadataState?.value ?? null,
    isFetchMetadataLoading: metadataState?.loading ?? false,
    fetchMetadataError: metadataState?.error ?? null,
  };
}
