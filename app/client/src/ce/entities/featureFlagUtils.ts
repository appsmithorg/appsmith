import { selectFeatureFlagCheck } from "@appsmith/selectors/featureFlagsSelectors";
import store from "store";

export const getIsOneClickBindingEnabled = () =>
  selectFeatureFlagCheck(store.getState(), "release_enable_one_click_binding");
