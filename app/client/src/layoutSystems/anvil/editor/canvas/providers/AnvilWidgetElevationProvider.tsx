import React, {
  type ReactNode,
  createContext,
  useState,
  useCallback,
  useContext,
} from "react";

interface WidgetElevationObj {
  [key: string]: boolean;
}

interface AnvilWidgetElevationContextType {
  elevatedWidgets: WidgetElevationObj;
  setWidgetElevation: (widgetId: string, isElevated: boolean) => void;
}

const AnvilWidgetElevationContext = createContext<
  AnvilWidgetElevationContextType | undefined
>(undefined);

export const useAnvilWidgetElevation = () =>
  useContext(AnvilWidgetElevationContext);

export const AnvilWidgetElevationProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [elevatedWidgets, setElevatedWidgets] = useState<WidgetElevationObj>(
    {},
  );

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
