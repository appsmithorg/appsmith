import {
  selectInitialized,
  selectInitializing,
} from "git/store/selectors/gitArtifactSelectors";
import useArtifactSelector from "./useArtifactSelector";

export default function useInit() {
  const initializing = useArtifactSelector(selectInitializing);

  const initialized = useArtifactSelector(selectInitialized);

  return {
    isInitializing: initializing ?? false,
    isInitialized: initialized ?? false,
  };
}
