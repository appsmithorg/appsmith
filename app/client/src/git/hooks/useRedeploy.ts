import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { publishApplication } from "ee/actions/applicationActions";
import {
  getCurrentApplicationId,
  getIsPublishingApplication,
} from "selectors/editorSelectors";

export default function useRedeploy() {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const isRedeploying = useSelector(getIsPublishingApplication);

  const redeploy = useCallback(() => {
    if (applicationId) {
      dispatch(publishApplication(applicationId));
    }
  }, [applicationId, dispatch]);

  return {
    isRedeploying,
    redeploy,
  };
}
