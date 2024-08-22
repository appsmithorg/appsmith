import type { AppState } from "ee/reducers";
import { useDispatch, useSelector } from "react-redux";

import type { ConversionProps } from "../ConversionForm";
import { useAutoToFixedLayoutFlow } from "./useAutoToFixedLayoutFlow";
import { useFixedToAutoLayoutFlow } from "./useFixedToAutoLayoutFlow";

//Hook that helps with rendering of conversion form based on the Flow
export const useConversionForm = (hookProps?: {
  isAutoLayout: boolean;
}): ConversionProps => {
  const dispatch = useDispatch();
  const conversionState = useSelector(
    (state: AppState) => state.ui.layoutConversion.conversionState,
  );

  const autoToFixedWorkflow = useAutoToFixedLayoutFlow(dispatch);

  const fixedToAutoWorkflow = useFixedToAutoLayoutFlow(dispatch);

  return hookProps?.isAutoLayout
    ? autoToFixedWorkflow[conversionState] || {}
    : fixedToAutoWorkflow[conversionState] || {};
};
