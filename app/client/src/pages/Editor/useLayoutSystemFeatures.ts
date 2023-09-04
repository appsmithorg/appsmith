import { useSelector } from "react-redux";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import { getCurrentAppPositioningType } from "selectors/editorSelectors";

//This file will be eventually moved to layoutSystems folder once the base widget separation PR is merged
export const layoutSystemFeatures = {
  ENABLE_MAIN_CANVAS_RESIZER: "ENABLE_MAIN_CANVAS_RESIZER", //enable main canvas resizer
  ENABLE_FORKING_FROM_TEMPLATES: "ENABLE_FORKING_FROM_TEMPLATES", //enable forking pages from template directly inside apps
  ENABLE_LAYOUT_CONTROL: "ENABLE_LAYOUT_CONTROL", //enables layout control option in property pane
};

const FIXED_LAYOUT_FEATURES = {
  [layoutSystemFeatures.ENABLE_FORKING_FROM_TEMPLATES]: true,
  [layoutSystemFeatures.ENABLE_LAYOUT_CONTROL]: true,
};

const AUTO_LAYOUT_FEATURES = {
  [layoutSystemFeatures.ENABLE_MAIN_CANVAS_RESIZER]: true,
};

export const useLayoutSystemFeatures = () => {
  const appPositioningType = useSelector(getCurrentAppPositioningType);

  let currentFeatureSet: {
    [x: string]: boolean;
  } = {};

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
  return (checkFeaturesArray: string[]) => {
    const featuresArray: boolean[] = [];

    for (const checkFeature of checkFeaturesArray) {
      featuresArray.push(!!currentFeatureSet[checkFeature]);
    }

    return featuresArray;
  };
};
