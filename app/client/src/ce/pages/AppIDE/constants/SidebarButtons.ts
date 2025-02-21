import {
  DataButton,
  EditorButton,
  LibrariesButton,
  SettingsButton,
} from "IDE/constants/SidebarButtons";
import { Condition, type IDESidebarButton } from "@appsmith/ads";
import {
  createMessage,
  EMPTY_DATASOURCE_TOOLTIP_SIDEBUTTON,
} from "ee/constants/messages";

const DataButtonWithWarning: IDESidebarButton = {
  ...DataButton("datasource"),
  condition: Condition.Warn,
  tooltip: createMessage(EMPTY_DATASOURCE_TOOLTIP_SIDEBUTTON),
};

const DataButtonWithoutWarning = DataButton("datasource");

export const BottomButtons = (datasourcesExist: boolean) => [
  datasourcesExist ? DataButtonWithoutWarning : DataButtonWithWarning,
  LibrariesButton("libraries"),
  SettingsButton("settings"),
];
export const TopButtons = [EditorButton("")];
