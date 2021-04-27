import React from "react";
import CustomizedDropdown, {
  CustomizedDropdownProps,
} from "pages/common/CustomizedDropdown";

import { Directions } from "utils/helpers";
import { Action } from "entities/Action";
import { WidgetProps } from "widgets/BaseWidget";
import { getLightningMenuOptions } from "./helpers";
import { LightningMenuTrigger } from "./LightningMenuTrigger";
import { useActions, useWidgets, usePageId } from "./hooks";
import { Theme, Skin } from "constants/DefaultTheme";
import { withTheme } from "styled-components";
import { useDispatch } from "react-redux";

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

type LightningMenuProps = {
  isFocused: boolean;
  isOpened: boolean;
  onSelect?: (value: string) => void;
  onOpenLightningMenu: () => void;
  onCloseLightningMenu?: () => void;
  updateDynamicInputValue: (value: string, cursor?: number) => void;
  skin: Skin;
  theme: Theme;
};

export function LightningMenu(props: LightningMenuProps) {
  const widgets = useWidgets();
  const { apis, queries, saas } = useActions();
  const pageId = usePageId();
  const dispatch = useDispatch();

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
          theme={props.theme}
        />,
        props.onCloseLightningMenu,
      )}
    />
  );
}

export default withTheme(LightningMenu);
