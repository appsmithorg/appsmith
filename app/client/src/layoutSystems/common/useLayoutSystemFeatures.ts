import { useSelector } from "react-redux";
import { LayoutSystemTypes } from "layoutSystems/types";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";

export enum LayoutSystemFeatures {
  ENABLE_MAIN_CONTAINER_RESIZER = "ENABLE_MAIN_CONTAINER_RESIZER", //enable main canvas resizer
  ENABLE_FORKING_FROM_TEMPLATES = "ENABLE_FORKING_FROM_TEMPLATES", //enable forking pages from template directly inside apps
  ENABLE_CANVAS_LAYOUT_CONTROL = "ENABLE_CANVAS_LAYOUT_CONTROL", //enables layout control option in property pane
}

const FIXED_LAYOUT_FEATURES: Record<LayoutSystemFeatures, boolean> = {
  [LayoutSystemFeatures.ENABLE_FORKING_FROM_TEMPLATES]: true,
  [LayoutSystemFeatures.ENABLE_CANVAS_LAYOUT_CONTROL]: true,
  [LayoutSystemFeatures.ENABLE_MAIN_CONTAINER_RESIZER]: false,
};

const AUTO_LAYOUT_FEATURES: Record<LayoutSystemFeatures, boolean> = {
  [LayoutSystemFeatures.ENABLE_MAIN_CONTAINER_RESIZER]: true,
  [LayoutSystemFeatures.ENABLE_FORKING_FROM_TEMPLATES]: false,
  [LayoutSystemFeatures.ENABLE_CANVAS_LAYOUT_CONTROL]: false,
};

const ANVIL_LAYOUT_FEATURES: Record<LayoutSystemFeatures, boolean> = {
  [LayoutSystemFeatures.ENABLE_MAIN_CONTAINER_RESIZER]: true,
  [LayoutSystemFeatures.ENABLE_FORKING_FROM_TEMPLATES]: false,
  [LayoutSystemFeatures.ENABLE_CANVAS_LAYOUT_CONTROL]: false,
};

/**
 * This Hook is mainly written to be used as a central control to enable
 * layout specific features based on the type of current layout.
 * This way the components using it need not be aware of what layout it is on
 *
 * @returns This hook returns a method, which can be used to get a boolean corresponding to the feature supplied as argument.
 * The boolean will indicate if the feature is enabled for the current layout
 */
export const useLayoutSystemFeatures = () => {
  const layoutSystemType = useSelector(getLayoutSystemType);

  let currentFeatureSet = {} as Record<LayoutSystemFeatures, boolean>;

  switch (layoutSystemType) {
    case LayoutSystemTypes.ANVIL:
      currentFeatureSet = ANVIL_LAYOUT_FEATURES;
      break;
    case LayoutSystemTypes.FIXED:
      currentFeatureSet = FIXED_LAYOUT_FEATURES;
      break;
    case LayoutSystemTypes.AUTO:
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
