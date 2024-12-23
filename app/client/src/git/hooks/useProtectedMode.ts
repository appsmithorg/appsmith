import { selectProtectedMode } from "git/store/selectors/gitArtifactSelectors";
import useArtifactSelector from "./useArtifactSelector";

export default function useProtectedMode() {
  const isProtectedMode = useArtifactSelector(selectProtectedMode);

  return isProtectedMode ?? false;
}
