import { useDispatch } from "react-redux";
import { navigateToAnotherPage } from "actions/pageActions";
import type { AppsmithLocationState } from "utils/history";
import { useSelector } from "react-redux";
import { trimQueryString } from "utils/helpers";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { useStaticUrlGeneration } from "./useStaticUrlGeneration";

const useNavigateToAnotherPage = ({
  basePageId,
  query,
  state,
}: {
  basePageId: string;
  query: string;
  state: AppsmithLocationState;
}) => {
  const appMode = useSelector(getAppMode);
  const dispatch = useDispatch();

  // Use the common static URL generation hook
  const pageURL = useStaticUrlGeneration(basePageId, appMode);

  return () => {
    dispatch(
      navigateToAnotherPage({
        pageURL: trimQueryString(pageURL),
        query,
        state,
      }),
    );
  };
};

export default useNavigateToAnotherPage;
