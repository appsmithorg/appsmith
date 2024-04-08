import { setConversionFlowOverrideFlagAction } from "actions/autoLayoutActions";
import type { Dispatch } from "react";
import { useEffect } from "react";
import {
  getConversionFlowOverrideFlag,
  setConversionFlowOverrideFlag,
} from "utils/storage";
import { useIsConversionFlowEnabled } from "./useIsConversionFlowEnabled";
import { useDispatch } from "react-redux";

/**
 * Function to initiate the conversion flow override state.
 * It checks the conversion flow override flag and sets the flag action accordingly.
 */
const initiateConversionFlowOverrideState = (dispatch: Dispatch<any>) => {
  /**
   * Get the conversion flow override flag.
   * If the flag is not found, default value is set to false.
   * Then, set the conversion flow override flag action.
   */
  getConversionFlowOverrideFlag().then((flag = false) => {
    dispatch(setConversionFlowOverrideFlagAction(flag));
  });
};

/**
 * This hook is used to override the conversion flow.
 * It initializes the conversion flow override state and sets up a global function to toggle the override flag.
 *
 * @returns {void}
 */
export const useConversionOverride = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    // Initialize the conversion flow override state
    initiateConversionFlowOverrideState(dispatch);

    // Set up a global function to toggle the override flag
    (window as any).overrideConversionFlow = (flag = true) => {
      dispatch(setConversionFlowOverrideFlagAction(flag));
      setConversionFlowOverrideFlag(flag);
    };

    // Clean up the global function when the component unmounts
    return () => {
      delete (window as any).overrideConversionFlow;
    };
  }, []);
  const isConversionFlowEnabled = useIsConversionFlowEnabled();
  return isConversionFlowEnabled;
};
