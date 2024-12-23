import { selectConnected } from "git/store/selectors/gitSingleArtifactSelectors";
import useArtifactSelector from "./useArtifactSelector";

export default function useConnected() {
  const isConnected = useArtifactSelector(selectConnected);

  return isConnected ?? false;
}
