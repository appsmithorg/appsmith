import { useEffect } from "react";
import { useAnvilWidgetElevation } from "../providers/AnvilWidgetElevationProvider";

export const useAnvilWidgetElevationSetter = (
  widgetId: string,
  elevatedBackground: boolean,
) => {
  const anvilWidgetElevation = useAnvilWidgetElevation();
  const { setWidgetElevation } = anvilWidgetElevation || {};

  useEffect(() => {
    if (setWidgetElevation) {
      setWidgetElevation(widgetId, elevatedBackground);
    }
  }, [elevatedBackground, setWidgetElevation]);
};
