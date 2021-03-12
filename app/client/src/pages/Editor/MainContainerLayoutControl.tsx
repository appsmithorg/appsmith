import { updateApplicationLayout } from "actions/applicationActions";
import Dropdown from "components/ads/Dropdown";
import Icon, { IconName, IconSize } from "components/ads/Icon";
import { Colors } from "constants/Colors";
import React from "react";
import { useDispatch } from "react-redux";
import { AppState } from "reducers";
import {
  AppLayoutConfig,
  SupportedLayouts,
} from "reducers/entityReducers/pageListReducer";
import {
  getCurrentApplicationId,
  getCurrentApplicationLayout,
} from "selectors/editorSelectors";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import { useSelector } from "store";
import styled, { ThemeProvider } from "styled-components";
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
  .dropdown-wrapper {
    margin-left: 220px;
    width: 260px;
  }
  .bp3-popover-target {
    pointer-events: none;
  }
  .layout-control {
    pointer-events: all;
    width: 40px;
    cursor: pointer;
    font-size: 14px;
    border: none;
    &:hover {
      background-color: rgb(246, 246, 246);
    }
    &:focus {
      background-color: rgb(246, 246, 246);
    }
    box-shadow: none;
  }
`;

export const MainContainerLayoutControl: React.FC<any> = () => {
  const appId = useSelector(getCurrentApplicationId);
  const appLayout = useSelector(getCurrentApplicationLayout);
  const layoutOptions = AppsmithLayouts.map((each) => {
    return {
      ...each,
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
  const lightTheme = useSelector((state: AppState) =>
    getThemeDetails(state, ThemeMode.LIGHT),
  );

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
        <ThemeProvider theme={lightTheme}>
          <Dropdown
            width={260}
            SelectedValueNode={({ selected }) => {
              return (
                <Icon
                  fillColor={Colors.BLACK}
                  name={selected.icon}
                  size={IconSize.SMALL}
                />
              );
            }}
            className="layout-control"
            showDropIcon={false}
            options={layoutOptions}
            selected={selectedLayout || layoutOptions[0]}
            onSelect={noop}
          ></Dropdown>
        </ThemeProvider>
      </div>
    </LayoutControlWrapper>
  );
};
