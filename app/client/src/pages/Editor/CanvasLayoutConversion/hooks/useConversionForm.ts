import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { AppState } from "@appsmith/reducers";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAutoToFixedLayoutFlow } from "./useAutoToFixedLayoutFlow";
import { useFixedToAutoLayoutFlow } from "./useFixedToAutoLayoutFlow";

//Hook that helps with rendering of conversion form based on the Flow
export const useConversionForm = (
  onCancel: () => void,
  hookProps?: { isAutoLayout: boolean },
) => {
  const dispatch = useDispatch();
  const conversionState = useSelector(
    (state: AppState) => state.ui.layoutConversion.conversionState,
  );

  useEffect(() => {
    dispatch({
      type: ReduxActionTypes.START_CONVERSION_FLOW,
    });
  }, []);

  const autoToFixedWorkflow = useAutoToFixedLayoutFlow(dispatch, onCancel);

  const fixedToAutoWorkflow = useFixedToAutoLayoutFlow(dispatch, onCancel);

  return hookProps?.isAutoLayout
    ? autoToFixedWorkflow[conversionState] || {}
    : fixedToAutoWorkflow[conversionState] || {};

  return {};
};
