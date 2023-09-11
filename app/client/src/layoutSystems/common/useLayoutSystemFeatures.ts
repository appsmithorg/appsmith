import { useSelector } from "react-redux";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import { getCurrentAppPositioningType } from "selectors/editorSelectors";

export enum LayoutSystemFeatures {
  ENABLE_MAIN_CONTAINER_RESIZER = "ENABLE_MAIN_CONTAINER_RESIZER", //enable main canvas resizer
  ENABLE_FORKING_FROM_TEMPLATES = "ENABLE_FORKING_FROM_TEMPLATES", //enable forking pages from template directly inside apps
  ENABLE_CANVAS_LAYOUT_CONTROL = "ENABLE_CANVAS_LAYOUT_CONTROL", //enables layout control option in property pane
}

const FIXED_LAYOUT_FEATURES = {
  [LayoutSystemFeatures.ENABLE_FORKING_FROM_TEMPLATES]: true,
  [LayoutSystemFeatures.ENABLE_CANVAS_LAYOUT_CONTROL]: true,
} as Record<LayoutSystemFeatures, boolean>;

const AUTO_LAYOUT_FEATURES = {
  [LayoutSystemFeatures.ENABLE_MAIN_CONTAINER_RESIZER]: true,
} as Record<LayoutSystemFeatures, boolean>;

/**
 * This Hook is mainly written to be used as a central control to enable
 * layout specific features based on the type of current layout.
 * This way the components using it need not be aware of what layout it is on
 *
 * @returns This hook returns a method, which can be used to get a boolean corresponding to the feature supplied as argument.
 * The boolean will indicate if the feature is enabled for the current layout
 */
export const useLayoutSystemFeatures = () => {
  const appPositioningType = useSelector(getCurrentAppPositioningType);

  let currentFeatureSet = {} as Record<LayoutSystemFeatures, boolean>;

  switch (appPositioningType) {
    case AppPositioningTypes.FIXED:
      currentFeatureSet = FIXED_LAYOUT_FEATURES;
      break;
    case AppPositioningTypes.AUTO:
      currentFeatureSet = AUTO_LAYOUT_FEATURES;
      break;
  }

  /**
   * This method checks if the features requested in the method,
   * can be enabled for the given particular layout type
   */
  return (checkFeaturesArray: LayoutSystemFeatures[]) => {
    const featuresArray: boolean[] = [];

    for (const checkFeature of checkFeaturesArray) {
      featuresArray.push(!!currentFeatureSet[checkFeature]);
    }

    return featuresArray;
  };
};
