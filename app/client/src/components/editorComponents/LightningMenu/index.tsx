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
import {
  useActions,
  useWidgets,
  usePageId,
  useAllActions,
  useDataSources,
  useApplicationId,
  usePluginIdsOfPackageNames,
} from "./hooks";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import { Datasource } from "api/DatasourcesApi";
import { Theme } from "constants/DefaultTheme";
import { withTheme } from "styled-components";

const LightningIcon = ControlIcons.LIGHTNING_CONTROL;
const lightningMenuOptions = (
  themeType: string,
  apis: RestAction[],
  queries: RestAction[],
  widgets: WidgetProps[],
  pageId: string,
  applicationId: string,
  actions: ActionData[],
  pluginIds: string[],
  dataSources: Datasource[],
  createNewApiAction: (pageId: string) => void,
  createAction: (data: Partial<RestAction>) => void,
  updatePropertyValue: (value: string, cursor?: number) => void,
  trigger: React.ReactNode,
): CustomizedDropdownProps => {
  const options = getLightningMenuOptions(
    apis,
    queries,
    widgets,
    pageId,
    applicationId,
    actions,
    pluginIds,
    dataSources,
    createNewApiAction,
    createAction,
    themeType,
    updatePropertyValue,
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
    themeType: themeType,
  };
};

type LightningMenuProps = {
  onSelect?: (value: string) => void;
  updatePropertyValue: (value: string, cursor?: number) => void;
  createNewApiAction: (pageId: string) => void;
  createAction: (data: Partial<RestAction>) => void;
  themeType: string;
  theme: Theme;
};

export const LightningMenu = (props: LightningMenuProps) => {
  const widgets = useWidgets();
  const { apis, queries } = useActions();
  const pageId = usePageId();
  const actions = useAllActions();
  const dataSources = useDataSources();
  const applicationId = useApplicationId();
  const pluginIds = usePluginIdsOfPackageNames();
  const lightningMenuTrigger = (
    <LightningIcon
      width={props.theme.lightningMenu.iconSize}
      height={props.theme.lightningMenu.iconSize}
      color={
        props.theme.lightningMenu[props.themeType as "light" | "dark"].color
      }
    />
  );

  return (
    <CustomizedDropdown
      {...lightningMenuOptions(
        props.themeType,
        apis,
        queries,
        widgets,
        pageId,
        applicationId,
        actions,
        pluginIds,
        dataSources,
        props.createNewApiAction,
        props.createAction,
        props.updatePropertyValue,
        lightningMenuTrigger,
      )}
    />
  );
};

export default withTheme(LightningMenu);
