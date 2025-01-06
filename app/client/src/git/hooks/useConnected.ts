import { selectConnected } from "git/store/selectors/gitArtifactSelectors";
import useArtifactSelector from "./useArtifactSelector";

export default function useConnected() {
  const isConnected = useArtifactSelector(selectConnected);

  return isConnected ?? false;
}
