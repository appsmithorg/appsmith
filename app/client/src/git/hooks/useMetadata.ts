import { selectMetadataState } from "git/store/selectors/gitArtifactSelectors";
import useArtifactSelector from "./useArtifactSelector";

export default function useMetadata() {
  const metadataState = useArtifactSelector(selectMetadataState);

  return {
    metadata: metadataState?.value ?? null,
    isFetchMetadataLoading: metadataState?.loading ?? false,
    fetchMetadataError: metadataState?.error ?? null,
  };
}
