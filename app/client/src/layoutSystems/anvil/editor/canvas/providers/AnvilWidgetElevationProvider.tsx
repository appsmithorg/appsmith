import React, {
  type ReactNode,
  createContext,
  useState,
  useCallback,
  useContext,
} from "react";

interface WidgetElevation {
  [key: string]: boolean;
}

interface AnvilWidgetElevationContextType {
  elevatedWidgets: WidgetElevation;
  setWidgetElevation: (widgetId: string, isElevated: boolean) => void;
}

const AnvilWidgetElevationContext = createContext<
  AnvilWidgetElevationContextType | undefined
>(undefined);

export const useAnvilWidgetElevation = () =>
  useContext(AnvilWidgetElevationContext);
/**
 * AnvilWidgetElevationProvider indexes all sections and zones and records their evaluated value of elevation(Visual Separation).
 *
 * Why not just use the evaluated values directly?
 * Because we need to keep track of the elevation of each widget in the editor to apply the correct elevation styles.
 * elevation being a bindable property, we need to keep track of the evaluated value of elevation of each sections and zones in the editor.
 *
 * When adding compensators to the dragged widgets(useAnvilDnDCompensators), we need to know the elevation of the zone widget as well as its corresponding siblings
 * to decide if the zone has to treated as a elevated zone or not.
 *
 * In-order to skip iterating the data tree every time we need to know the elevation of a widget, we are storing the elevation of each widget in this context.
 * This way we do not have dependency on the data tree to know the elevation of a widget.
 */
export const AnvilWidgetElevationProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [elevatedWidgets, setElevatedWidgets] = useState<WidgetElevation>({});

  const setWidgetElevation = useCallback(
    (widgetId: string, isElevated: boolean) => {
      setElevatedWidgets((prev) => {
        return {
          ...prev,
          [widgetId]: isElevated,
        };
      });
    },
    [setElevatedWidgets],
  );

  return (
    <AnvilWidgetElevationContext.Provider
      value={{
        elevatedWidgets,
        setWidgetElevation,
      }}
    >
      {children}
    </AnvilWidgetElevationContext.Provider>
  );
};
