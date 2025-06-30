import { useDispatch } from "react-redux";
import { navigateToAnotherPage } from "actions/pageActions";
import type { AppsmithLocationState } from "utils/history";
import { APP_MODE } from "entities/App";
import { useHref } from "pages/Editor/utils";
import { builderURL, viewerURL } from "ee/RouteBuilder";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { useSelector } from "react-redux";
import { trimQueryString } from "utils/helpers";

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
  const pageURL = useHref(
    appMode === APP_MODE.PUBLISHED ? viewerURL : builderURL,
    { basePageId: basePageId },
  );

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
