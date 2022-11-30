import classNames from "classnames";
import { useDispatch, useSelector } from "react-redux";
import React, { useMemo, useCallback } from "react";

import {
  getCurrentApplicationId,
  getCurrentApplicationLayout,
} from "selectors/editorSelectors";
import { Colors } from "constants/Colors";
import {
  AppLayoutConfig,
  SupportedLayouts,
} from "reducers/entityReducers/pageListReducer";
import { TooltipComponent, Icon, IconName, IconSize } from "design-system";
import { updateApplicationLayout } from "actions/applicationActions";

interface AppsmithLayoutConfigOption {
  name: string;
  type: SupportedLayouts;
  icon?: IconName;
}

export const AppsmithDefaultLayout: AppLayoutConfig = {
  type: "FLUID",
};

const AppsmithLayouts: AppsmithLayoutConfigOption[] = [
  {
    name: "Fluid Width",
    type: "FLUID",
    icon: "fluid",
  },
  {
    name: "Desktop",
    type: "DESKTOP",
    icon: "desktop",
  },
  {
    name: "Tablet (Landscape)",
    type: "TABLET_LARGE",
    icon: "tabletLandscape",
  },
  {
    name: "Tablet (Portrait)",
    type: "TABLET",
    icon: "tablet",
  },
  {
    name: "Mobile Device",
    type: "MOBILE",
    icon: "mobile",
  },
];

export function MainContainerLayoutControl() {
  const dispatch = useDispatch();
  const appId = useSelector(getCurrentApplicationId);
  const appLayout = useSelector(getCurrentApplicationLayout);

  const buttonRefs: Array<HTMLButtonElement | null> = [];

  /**
   * return selected layout index. if there is no app
   * layout, use the default one ( fluid )
   */
  const selectedIndex = useMemo(() => {
    return AppsmithLayouts.findIndex(
      (each) => each.type === (appLayout?.type || AppsmithDefaultLayout.type),
    );
  }, [appLayout]);

  const [focusedIndex, setFocusedIndex] = React.useState(selectedIndex);

  /**
   * updates the app layout
   *
   * @param layoutConfig
   */
  const updateAppLayout = useCallback(
    (layoutConfig: AppLayoutConfig) => {
      const { type } = layoutConfig;

      dispatch(
        updateApplicationLayout(appId || "", {
          appLayout: {
            type,
          },
        }),
      );
    },
    [dispatch, appLayout],
  );

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (!buttonRefs.length) return;

    switch (event.key) {
      case "ArrowRight":
      case "Right":
        const rightIndex = index === buttonRefs.length - 1 ? 0 : index + 1;
        buttonRefs[rightIndex]?.focus();
        setFocusedIndex(rightIndex);
        break;
      case "ArrowLeft":
      case "Left":
        const leftIndex = index === 0 ? buttonRefs.length - 1 : index - 1;
        buttonRefs[leftIndex]?.focus();
        setFocusedIndex(leftIndex);
        break;
    }
  };

  return (
    <div className="pb-6 space-y-2 t--layout-control-wrapper">
      <div
        className="flex justify-around"
        onBlur={() => setFocusedIndex(selectedIndex)}
      >
        {AppsmithLayouts.map((layoutOption: any, index: number) => {
          return (
            <TooltipComponent
              className="flex-grow"
              content={layoutOption.name}
              key={layoutOption.name}
              position={
                index === AppsmithLayouts.length - 1 ? "bottom-right" : "bottom"
              }
            >
              <button
                className={classNames({
                  "border-transparent border flex items-center justify-center p-2 flex-grow  focus:bg-gray-200": true,
                  "bg-white border-gray-300": selectedIndex === index,
                  "bg-gray-100 hover:bg-gray-200": selectedIndex !== index,
                })}
                onClick={() => {
                  updateAppLayout(layoutOption);
                  setFocusedIndex(index);
                }}
                onKeyDown={(event) => handleKeyDown(event, index)}
                ref={(input) => buttonRefs.push(input)}
                tabIndex={index === focusedIndex ? 0 : -1}
              >
                <Icon
                  fillColor={Colors.BLACK}
                  name={layoutOption.icon}
                  size={layoutOption.iconSize || IconSize.MEDIUM}
                />
              </button>
            </TooltipComponent>
          );
        })}
      </div>
    </div>
  );
}
