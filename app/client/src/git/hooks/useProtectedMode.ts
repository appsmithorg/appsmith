import { selectProtectedMode } from "git/store/selectors/gitSingleArtifactSelectors";
import useAritfactSelector from "./useArtifactSelector";

export default function useProtectedMode() {
  const isProtectedMode = useAritfactSelector(selectProtectedMode);

  return isProtectedMode ?? false;
}
