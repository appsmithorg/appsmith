import React from "react";
import {
  ADD_CUSTOM_ACTION,
  CONFIG_PROPERTY_COMMAND,
  createMessage,
  CUSTOM_ACTION_LABEL,
  NO_SEARCH_COMMAND_FOUND_EXTERNAL_SAAS,
  NOT_FOUND,
} from "ee/constants/messages";
import { Button, Flex, Text, type SelectOptionProps } from "@appsmith/ads";
import { useSelector } from "react-redux";
import { getPlugin } from "ee/selectors/entitiesSelector";
import { PluginType, type Plugin } from "entities/Plugin";
export default function NoSearchCommandFound({
  configProperty,
  onSelectOptions,
  options,
  pluginId,
}: {
  configProperty: string;
  onSelectOptions: (optionValueToSelect: string) => void;
  options: SelectOptionProps[];
  pluginId?: string;
}) {
  const plugin: Plugin | undefined = useSelector((state) =>
    getPlugin(state, pluginId || ""),
  );

  const isExternalSaasPluginCommandDropdown =
    plugin?.type === PluginType.EXTERNAL_SAAS &&
    configProperty.includes(createMessage(CONFIG_PROPERTY_COMMAND));

  const customActionOption = options.find((option) =>
    option.label
      .toLowerCase()
      .includes(createMessage(CUSTOM_ACTION_LABEL).toLowerCase()),
  );

  const onClick = () => {
    onSelectOptions(customActionOption!.value);
    document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  };

  if (isExternalSaasPluginCommandDropdown && customActionOption) {
    return (
      <Flex
        alignItems="center"
        flexDirection={"column"}
        gap="spaces-5"
        padding="spaces-7"
      >
        <Text color="var(--ads-v2-color-gray-500)">
          {createMessage(NO_SEARCH_COMMAND_FOUND_EXTERNAL_SAAS)}
        </Text>
        <Button
          data-testid="t--select-custom--action"
          kind="secondary"
          onClick={onClick}
          size="sm"
          startIcon="plus"
        >
          {createMessage(ADD_CUSTOM_ACTION)}
        </Button>
      </Flex>
    );
  }

  return <>{createMessage(NOT_FOUND)}</>;
}
