import { updateApplicationLayout } from "actions/applicationActions";
import Icon, { IconName, IconSize } from "components/ads/Icon";
import { Colors } from "constants/Colors";
import React, { useMemo, useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  AppLayoutConfig,
  SupportedLayouts,
} from "reducers/entityReducers/pageListReducer";
import {
  getCurrentApplicationId,
  getCurrentApplicationLayout,
} from "selectors/editorSelectors";
import { useSelector } from "store";
import classNames from "classnames";

interface AppsmithLayoutConfigOption {
  name: string;
  type: SupportedLayouts;
  icon?: IconName;
}

export const AppsmithDefaultLayout: AppLayoutConfig = {
  type: "DESKTOP",
};

const AppsmithLayouts: AppsmithLayoutConfigOption[] = [
  {
    name: "Desktop",
    ...AppsmithDefaultLayout,
    icon: "desktop",
  },
  {
    name: "Tablet(Large)",
    type: "TABLET_LARGE",
    icon: "tablet",
  },
  {
    name: "Tablet",
    type: "TABLET",
    icon: "tablet",
  },
  {
    name: "Mobile Device",
    type: "MOBILE",
    icon: "mobile",
  },
  {
    name: "Fluid Width",
    type: "FLUID",
    icon: "fluid",
  },
];

export function MainContainerLayoutControl() {
  const dispatch = useDispatch();
  const appId = useSelector(getCurrentApplicationId);
  const appLayout = useSelector(getCurrentApplicationLayout);

  /**
   * selected layout. if there is no app
   * layout, use the first one
   */
  const selectedLayout = useMemo(() => {
    return appLayout
      ? AppsmithLayouts.find((each) => each.type === appLayout.type)
      : AppsmithLayouts[0];
  }, [appLayout]);

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

  // eslint-disable-next-line
  return (
    <div className="px-3 space-y-1 t--layout-control-wrapper">
      <p className="text-sm text-gray-700">Canvas Size</p>
      <div className="flex justify-around">
        {AppsmithLayouts.map((layoutOption: any) => {
          return (
            <button
              className={classNames({
                "bg-gray-100 hover:bg-gray-200 flex items-center justify-center p-2 flex-grow": true,
                "bg-gray-200": selectedLayout?.name === layoutOption.name,
              })}
              key={layoutOption.name}
              onClick={() => updateAppLayout(layoutOption)}
            >
              <Icon
                fillColor={Colors.BLACK}
                name={layoutOption.icon}
                size={layoutOption.iconSize || IconSize.MEDIUM}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
