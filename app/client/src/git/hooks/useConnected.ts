import { selectConnected } from "git/store/selectors/gitSingleArtifactSelectors";
import useAritfactSelector from "./useArtifactSelector";

export default function useConnected() {
  const isConnected = useAritfactSelector(selectConnected);

  return isConnected ?? false;
}
