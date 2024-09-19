import React from "react";
import { Directions } from "utils/helpers";
import type { Action } from "entities/Action";
import type { WidgetProps } from "widgets/BaseWidget";
import { getLightningMenuOptions } from "./helpers";
import { LightningMenuTrigger } from "./LightningMenuTrigger";
import { useActions, useWidgets, usePageId } from "./hooks";
import type { Skin, Theme } from "constants/DefaultTheme";
import { useDispatch } from "react-redux";
import { useTheme } from "styled-components";
import type { CustomizedDropdownProps } from "pages/common/CustomizedDropdown";
import CustomizedDropdown from "pages/common/CustomizedDropdown";

const lightningMenuOptions = (
  skin: Skin,
  apis: Action[],
  queries: Action[],
  widgets: WidgetProps[],
  pageId: string,
  dispatch: (action: unknown) => void,
  updateDynamicInputValue: (value: string, cursor?: number) => void,
  trigger: React.ReactNode,
  onCloseLightningMenu?: () => void,
): CustomizedDropdownProps => {
  const options = getLightningMenuOptions(
    apis,
    queries,
    widgets,
    pageId,
    dispatch,
    skin,
    updateDynamicInputValue,
  );

  return {
    sections: [
      {
        options,
      },
    ],
    openDirection: Directions.DOWN,
    trigger: {
      content: trigger,
    },
    skin,
    onCloseDropDown: () => {
      if (onCloseLightningMenu) {
        onCloseLightningMenu();
      }
    },
    modifiers: {
      offset: {
        offset: "0, 32px",
      },
    },
  };
};

interface LightningMenuProps {
  isFocused: boolean;
  isOpened: boolean;
  onSelect?: (value: string) => void;
  onOpenLightningMenu: () => void;
  onCloseLightningMenu?: () => void;
  updateDynamicInputValue: (value: string, cursor?: number) => void;
  skin: Skin;
}

export function LightningMenu(props: LightningMenuProps) {
  const widgets = useWidgets();
  const { apis, queries, saas } = useActions();
  const pageId = usePageId();
  const dispatch = useDispatch();
  const theme = useTheme() as Theme;

  return (
    <CustomizedDropdown
      {...lightningMenuOptions(
        props.skin,
        [...apis, ...saas],
        queries,
        widgets,
        pageId,
        dispatch,
        props.updateDynamicInputValue,
        <LightningMenuTrigger
          isFocused={props.isFocused}
          isOpened={props.isOpened}
          onOpenLightningMenu={props.onOpenLightningMenu}
          skin={props.skin}
          theme={theme}
        />,
        props.onCloseLightningMenu,
      )}
    />
  );
}

export default LightningMenu;
