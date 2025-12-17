import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { redeployApplication } from "ee/actions/applicationActions";
import {
  getCurrentApplicationId,
  getIsRedeployingApplication,
} from "selectors/editorSelectors";

export default function useRedeploy() {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const isRedeploying = useSelector(getIsRedeployingApplication);

  const redeploy = useCallback(() => {
    if (applicationId) {
      dispatch(redeployApplication(applicationId));
    }
  }, [applicationId, dispatch]);

  return {
    isRedeploying,
    redeploy,
  };
}
