import type { AppState } from "@appsmith/reducers";

import { useSelector } from "react-redux";
import type { WidgetType } from "WidgetProvider/factory";

export default function useWidgetConfig(type: WidgetType, attr: string) {
  const config = useSelector(
    (state: AppState) => state.entities.widgetConfig.config[type],
  );
  return config[attr];
}
