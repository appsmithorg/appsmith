import React from "react";
import { Flex, Text } from "@appsmith/ads";
import { useChangeActionCall } from "./hooks/useChangeActionCall";
import { usePluginActionContext } from "../../PluginActionContext";
import { UIComponentTypes } from "api/PluginApi";
import APIEditorForm from "./components/ApiEditor";
import GraphQLEditorForm from "./components/GraphQLEditor";
import UQIEditorForm from "./components/UQIEditor";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { createMessage, UNEXPECTED_ERROR } from "ee/constants/messages";

const PluginActionForm = () => {
  useChangeActionCall();
  const { editorConfig, plugin } = usePluginActionContext();

  if (!editorConfig) {
    return (
      <CenteredWrapper>
        <Text color="var(--ads-v2-color-fg-error)" kind="heading-m">
          {createMessage(UNEXPECTED_ERROR)}
        </Text>
      </CenteredWrapper>
    );
  }

  return (
    <Flex flex="1" overflow="hidden" p="spaces-4" w="100%">
      {plugin.uiComponent === UIComponentTypes.ApiEditorForm && (
        <APIEditorForm />
      )}
      {plugin.uiComponent === UIComponentTypes.GraphQLEditorForm && (
        <GraphQLEditorForm />
      )}
      {(plugin.uiComponent === UIComponentTypes.DbEditorForm ||
        plugin.uiComponent === UIComponentTypes.UQIDbEditorForm) && (
        <UQIEditorForm />
      )}
    </Flex>
  );
};

export default PluginActionForm;
