import React from "react";
import { Flex, Icon } from "@appsmith/ads";
import { useSelector } from "react-redux";
import { getIsActionConverting } from "ee/selectors/entitiesSelector";
import { usePluginActionContext } from "PluginActionEditor";
import {
  ENTITY_ICON_SIZE,
  EntityIcon,
} from "pages/Editor/Explorer/ExplorerIcons";
import ConvertEntityNotification from "ee/pages/common/ConvertEntityNotification";
import { resolveIcon } from "pages/Editor/utils";

const PluginIcon = () => {
  const { action, plugin } = usePluginActionContext();
  return (
    resolveIcon({
      iconLocation: plugin.iconLocation || "",
      pluginType: plugin.type,
      moduleType: action.actionConfiguration?.body?.moduleType,
    }) || (
      <EntityIcon
        height={`${ENTITY_ICON_SIZE}px`}
        width={`${ENTITY_ICON_SIZE}px`}
      >
        <Icon name="module" />
      </EntityIcon>
    )
  );
};

const ConvertToModuleCallout = () => {
  const { action } = usePluginActionContext();
  const isConverting = useSelector((state) =>
    getIsActionConverting(state, action.id),
  );
  if (!isConverting) return null;
  return (
    <Flex p="spaces-7" w="100%">
      {/* eslint-disable-next-line react-perf/jsx-no-jsx-as-prop */}
      <ConvertEntityNotification icon={<PluginIcon />} name={action.name} />
    </Flex>
  );
};

export default ConvertToModuleCallout;
