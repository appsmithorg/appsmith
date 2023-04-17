import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { PluginPackageName } from "entities/Action";
import { isNumber } from "lodash";
import { useContext } from "react";
import { useDispatch } from "react-redux";
import { WidgetQueryGeneratorFormContext } from "..";
import { DEFAULT_DROPDOWN_OPTION } from "../constants";

export function useConnectData() {
  const dispatch = useDispatch();

  const { config } = useContext(WidgetQueryGeneratorFormContext);

  const onClick = () => {
    dispatch({
      type: ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE,
      payload: config,
    });
  };

  const show =
    config.datasource !== DEFAULT_DROPDOWN_OPTION &&
    config.table !== DEFAULT_DROPDOWN_OPTION &&
    (config.datasource.data.pluginPackageName !==
      PluginPackageName.GOOGLE_SHEETS ||
      config.sheet !== DEFAULT_DROPDOWN_OPTION);

  const disabled =
    config.datasource.data.pluginPackageName ===
      PluginPackageName.GOOGLE_SHEETS &&
    (!config.tableHeaderIndex ||
      !isNumber(Number(config.tableHeaderIndex)) ||
      isNaN(Number(config.tableHeaderIndex)));

  return {
    show,
    disabled,
    onClick,
  };
}
