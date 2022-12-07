import { AppState } from "@appsmith/reducers";

import { useSelector } from "react-redux";
import { WidgetType } from "utils/WidgetFactory";

export default function useWidgetConfig(type: WidgetType, attr: string) {
  const config = useSelector(
    (state: AppState) => state.entities.widgetConfig.config[type],
  );
  return config[attr];
}
