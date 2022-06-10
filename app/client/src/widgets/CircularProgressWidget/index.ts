import IconSVG from "./icon.svg";
import Widget from "../ProgressBarWidget/widget";
import { ProgressType } from "../ProgressWidget/constants";

import { CONFIG as BASE_CONFIG } from "../ProgressWidget";

export const CONFIG = {
  ...BASE_CONFIG,
  type: "CIRCULAR_PROGRESS_WIDGET",
  name: "Circular Progress",
  iconSVG: IconSVG,
  defaults: {
    ...BASE_CONFIG.defaults,
    widgetName: "CircularProgress",
    progressType: ProgressType.CIRCULAR,
    rows: 17,
    columns: 16,
    showResult: true,
  },
};

export default Widget;
