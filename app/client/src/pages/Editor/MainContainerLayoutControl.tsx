import classNames from "classnames";
import { useDispatch } from "react-redux";
import React, { useMemo, useCallback } from "react";

import {
  getCurrentApplicationId,
  getCurrentApplicationLayout,
} from "selectors/editorSelectors";
import { useSelector } from "store";
import { Colors } from "constants/Colors";
import {
  AppLayoutConfig,
  SupportedLayouts,
} from "reducers/entityReducers/pageListReducer";
import TooltipComponent from "components/ads/Tooltip";
import Icon, { IconName, IconSize } from "components/ads/Icon";
import { updateApplicationLayout } from "actions/applicationActions";

import { setEnableReflowAction } from "actions/reflowActions";
import Checkbox from "components/ads/Checkbox";
import { ReactComponent as BetaIcon } from "assets/icons/menu/beta.svg";
import styled from "styled-components";
import { isReflowEnabled } from "selectors/widgetReflowSelectors";
import { setReflowBetaFlag } from "utils/storage";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentUser } from "selectors/usersSelectors";
import { User } from "constants/userConstants";

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
];
const ReflowBetaWrapper = styled.div`
  display: inline-flex;
  flex-direction: row;
  .beta-icon {
    fill: #feb811;
    rect {
      stroke: #feb811;
    }
    path {
      fill: #fff;
    }
  }
`;

export function MainContainerLayoutControl() {
  const dispatch = useDispatch();
  const appId = useSelector(getCurrentApplicationId);
  const appLayout = useSelector(getCurrentApplicationLayout);
  const shouldResize = useSelector(isReflowEnabled);
  const user: User | undefined = useSelector(getCurrentUser);
  /**
   * return selected layout. if there is no app
   * layout, use the default one ( fluid )
   */
  const selectedLayout = useMemo(() => {
    return AppsmithLayouts.find(
      (each) => each.type === (appLayout?.type || AppsmithDefaultLayout.type),
    );
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

  const reflowBetaToggle = (isChecked: boolean) => {
    if (user?.email) {
      setReflowBetaFlag(user.email, isChecked);
    }
    dispatch(setEnableReflowAction(isChecked));
    AnalyticsUtil.logEvent("REFLOW_BETA_FLAG", {
      enabled: isChecked,
    });
  };
  const appsmithEmailRegex = /@appsmith.com/g;
  const canReflow = user && user.email && appsmithEmailRegex.test(user.email);

  return (
    <div className="px-3 space-y-2 t--layout-control-wrapper">
      <p className="text-sm text-gray-700">Canvas Size</p>
      <div className="flex justify-around">
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
                  "border-transparent border flex items-center justify-center p-2 flex-grow": true,
                  "bg-white border-gray-300":
                    selectedLayout?.name === layoutOption.name,
                  "bg-gray-100 hover:bg-gray-200":
                    selectedLayout?.name !== layoutOption.name,
                })}
                onClick={() => updateAppLayout(layoutOption)}
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
      {canReflow && (
        <ReflowBetaWrapper>
          <Checkbox
            isDefaultChecked={shouldResize}
            label="New Reflow & Resize"
            onCheckChange={reflowBetaToggle}
          />
          <BetaIcon className="beta-icon" />
        </ReflowBetaWrapper>
      )}
    </div>
  );
}
