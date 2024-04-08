import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { useSelector } from "react-redux";
import { getConversionFlowOverrideFlagSelector } from "selectors/autoLayoutSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

/**
 * Determines if the conversion flow is enabled.
 *
 * @returns {boolean} - True if the conversion flow is enabled, false otherwise.
 */
export const useIsConversionFlowEnabled = () => {
  const isConversionFlowFlagEnabled = useFeatureFlag(
    FEATURE_FLAG.release_layout_conversion_enabled,
  );
  const isConversionFlowOverrideEnabled = useSelector(
    getConversionFlowOverrideFlagSelector,
  );
  return isConversionFlowFlagEnabled || isConversionFlowOverrideEnabled;
};
