export * from "ce/components/editorComponents/Debugger/ErrorLogs/getLogIconForEntity";
import React from "react";
import type { LogItemProps } from "components/editorComponents/Debugger/ErrorLogs/ErrorLogItem";
import { getIconForEntity as CE_getIconForEntity } from "ce/components/editorComponents/Debugger/ErrorLogs/getLogIconForEntity";
import { importRemixIcon } from "@design-system/widgets-old";
import type { Plugin } from "api/PluginApi";
import { ENTITY_TYPE } from "@appsmith/entities/DataTree/types";

const GuideLineIcon = importRemixIcon(
  async () => import("remixicon-react/GuideLineIcon"),
);

export const getIconForEntity: Record<
  string,
  (props: LogItemProps, pluginGroups: Record<string, Plugin>) => any
> = {
  ...CE_getIconForEntity,
  [ENTITY_TYPE.MODULE_INPUT]: () => {
    return <GuideLineIcon />;
  },
  [ENTITY_TYPE.MODULE_INSTANCE]: () => {
    return <GuideLineIcon />;
  },
};
