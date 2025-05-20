import type { DefaultRootState } from "react-redux";
import { useDispatch, useSelector } from "react-redux";
import { useAutoToFixedLayoutFlow } from "./useAutoToFixedLayoutFlow";
import { useFixedToAutoLayoutFlow } from "./useFixedToAutoLayoutFlow";
import type { ConversionProps } from "../ConversionForm";

//Hook that helps with rendering of conversion form based on the Flow
export const useConversionForm = (hookProps?: {
  isAutoLayout: boolean;
}): ConversionProps => {
  const dispatch = useDispatch();
  const conversionState = useSelector(
    (state: DefaultRootState) => state.ui.layoutConversion.conversionState,
  );

  const autoToFixedWorkflow = useAutoToFixedLayoutFlow(dispatch);

  const fixedToAutoWorkflow = useFixedToAutoLayoutFlow(dispatch);

  return hookProps?.isAutoLayout
    ? autoToFixedWorkflow[conversionState] || {}
    : fixedToAutoWorkflow[conversionState] || {};
};
