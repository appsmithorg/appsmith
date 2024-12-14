import { useGitContext } from "git/components/GitContextProvider";
import {
  selectGitConnected,
  selectMetadataState,
} from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useSelector } from "react-redux";

export default function useMetadata() {
  const { artifactDef } = useGitContext();

  const metadataState = useSelector((state: GitRootState) =>
    selectMetadataState(state, artifactDef),
  );

  const isGitConnected = useSelector((state: GitRootState) =>
    selectGitConnected(state, artifactDef),
  );

  return {
    metadata: metadataState.value ?? null,
    isFetchMetadataLoading: metadataState.loading ?? false,
    fetchMetadataError: metadataState.error ?? null,
    isGitConnected,
  };
}
