import { selectMetadataState } from "git/store/selectors/gitSingleArtifactSelectors";
import useAritfactSelector from "./useArtifactSelector";

export default function useMetadata() {
  const metadataState = useAritfactSelector(selectMetadataState);

  return {
    metadata: metadataState?.value ?? null,
    isFetchMetadataLoading: metadataState?.loading ?? false,
    fetchMetadataError: metadataState?.error ?? null,
  };
}
