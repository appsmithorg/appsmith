import { ResponsiveBehavior } from "components/constants";
import {
  generateResponsiveBehaviorConfig,
  generateVerticalAlignmentConfig,
} from "utils/layoutPropertiesUtils";

export default {
  sectionName: "Responsive Layout",
  children: [
    generateResponsiveBehaviorConfig(ResponsiveBehavior.Fill),
    generateVerticalAlignmentConfig(),
  ],
};
