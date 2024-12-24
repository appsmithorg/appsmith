import { selectCurrentBranch } from "git/store/selectors/gitArtifactSelectors";
import { useSelector } from "react-redux";

export default function useCurrentBranch() {
  const currentBranch = useSelector(selectCurrentBranch);

  return currentBranch;
}
