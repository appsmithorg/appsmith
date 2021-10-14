import { Position } from "@blueprintjs/core";
import { updateApplicationLayout } from "actions/applicationActions";
import Dropdown from "components/ads/Dropdown";
import Icon, { IconName, IconSize } from "components/ads/Icon";
import TooltipComponent from "components/ads/Tooltip";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { Colors } from "constants/Colors";
import { createMessage, LAYOUT_DROPDOWN_TOOLTIP } from "constants/messages";
import React from "react";
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
import styled from "styled-components";
import { noop } from "utils/AppsmithUtils";

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

const LayoutControlWrapper = styled.div`
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  .layout-control {
    pointer-events: all;
    cursor: pointer;
    font-size: 14px;
    border: none;
    box-shadow: none;
  }
`;

export function MainContainerLayoutControl() {
  const appId = useSelector(getCurrentApplicationId);
  const appLayout = useSelector(getCurrentApplicationLayout);
  const layoutOptions = AppsmithLayouts.map((each) => {
    return {
      ...each,
      iconSize: IconSize.SMALL,
      iconColor: Colors.BLACK,
      value: each.name,
      onSelect: () =>
        updateAppLayout({
          type: each.type,
        }),
    };
  });
  const selectedLayout = appLayout
    ? layoutOptions.find((each) => each.type === appLayout.type)
    : layoutOptions[0];
  const dispatch = useDispatch();

  const updateAppLayout = (layoutConfig: AppLayoutConfig) => {
    const { type } = layoutConfig;
    dispatch(
      updateApplicationLayout(appId || "", {
        appLayout: {
          type,
        },
      }),
    );
  };
  return (
    <LayoutControlWrapper>
      <div className="layout-control t--layout-control-wrapper">
        <Dropdown
          SelectedValueNode={({ selected }) => {
            return (
              <TooltipComponent
                boundary="viewport"
                content={createMessage(LAYOUT_DROPDOWN_TOOLTIP)}
                hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
                position={Position.BOTTOM}
              >
                <Icon
                  fillColor={Colors.BLACK}
                  name={selected.icon}
                  size={selected.iconSize || IconSize.SMALL}
                />
              </TooltipComponent>
            );
          }}
          className="layout-control"
          onSelect={noop}
          options={layoutOptions}
          selected={selectedLayout || layoutOptions[0]}
          showDropIcon={false}
          width={"30px"}
        />
      </div>
    </LayoutControlWrapper>
  );
}
