import React from "react";
import { Tooltip } from "@blueprintjs/core";
import CustomizedDropdown, {
  CustomizedDropdownProps,
} from "pages/common/CustomizedDropdown";

import { Directions } from "utils/helpers";
import { RestAction } from "api/ActionAPI";
import { WidgetProps } from "widgets/BaseWidget";
import { ControlIcons } from "icons/ControlIcons";
import { LIGHTNING_MENU_DATA_TOOLTIP } from "constants/messages";

import { getLightningMenuOptions } from "./helpers";
import { useActions, useWidgets, usePageId } from "./hooks";
import { Theme } from "constants/DefaultTheme";
import { withTheme } from "styled-components";
import { useDispatch } from "react-redux";

const LightningIcon = ControlIcons.LIGHTNING_CONTROL;
const lightningMenuOptions = (
  skin: string,
  apis: RestAction[],
  queries: RestAction[],
  widgets: WidgetProps[],
  pageId: string,
  dispatch: Function,
  updateDynamicInputValue: (value: string, cursor?: number) => void,
  trigger: React.ReactNode,
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
    usePortal: true,
    trigger: {
      content: (
        <Tooltip hoverOpenDelay={1000} content={LIGHTNING_MENU_DATA_TOOLTIP}>
          {trigger}
        </Tooltip>
      ),
    },
    skin,
  };
};

type LightningMenuProps = {
  onSelect?: (value: string) => void;
  updateDynamicInputValue: (value: string, cursor?: number) => void;
  skin: string;
  theme: Theme;
};

export const LightningMenu = (props: LightningMenuProps) => {
  const widgets = useWidgets();
  const { apis, queries } = useActions();
  const pageId = usePageId();
  const dispatch = useDispatch();
  const lightningMenuTrigger = (
    <LightningIcon
      width={props.theme.lightningMenu.iconSize}
      height={props.theme.lightningMenu.iconSize}
      color={props.theme.lightningMenu[props.skin as "light" | "dark"].color}
    />
  );

  return (
    <CustomizedDropdown
      {...lightningMenuOptions(
        props.skin,
        apis,
        queries,
        widgets,
        pageId,
        dispatch,
        props.updateDynamicInputValue,
        lightningMenuTrigger,
      )}
    />
  );
};

export default withTheme(LightningMenu);
