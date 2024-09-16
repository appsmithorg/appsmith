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

const ConvertToModuleCallout = () => {
  const { action, plugin } = usePluginActionContext();
  const isConverting = useSelector((state) =>
    getIsActionConverting(state, action.id),
  );

  const PluginIcon = resolveIcon({
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
  );

  if (!isConverting) return null;
  return (
    <Flex p="spaces-7" w="100%">
      <ConvertEntityNotification icon={PluginIcon} name={action.name} />
    </Flex>
  );
};

export default ConvertToModuleCallout;
