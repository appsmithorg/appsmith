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
import { createGlobalStyle, withTheme } from "styled-components";
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

const CustomDropdownStyles = createGlobalStyle`
  .bp3-popover {
    box-shadow: 0px 12px 28px rgba(0, 0, 0, 0.6);
    border-radius: 0px;
  }
`;

export const LightningMenu = (props: LightningMenuProps) => {
  const widgets = useWidgets();
  const { apis, queries } = useActions();
  const pageId = usePageId();
  const dispatch = useDispatch();

  return (
    <>
      <CustomizedDropdown
        {...lightningMenuOptions(
          props.skin,
          apis,
          queries,
          widgets,
          pageId,
          dispatch,
          props.updateDynamicInputValue,
          <LightningMenuTrigger
            skin={props.skin}
            theme={props.theme}
            isFocused={props.isFocused}
            isOpened={props.isOpened}
            onOpenLightningMenu={props.onOpenLightningMenu}
          />,
          props.onCloseLightningMenu,
        )}
      />
      <CustomDropdownStyles />
    </>
  );
};

export default withTheme(LightningMenu);
