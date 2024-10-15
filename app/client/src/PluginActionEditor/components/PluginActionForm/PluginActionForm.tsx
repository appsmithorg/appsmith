import React from "react";
import APIEditorForm from "./components/APIEditorForm";
import { Flex } from "@appsmith/ads";
import { useChangeActionCall } from "./hooks/useChangeActionCall";
import { usePluginActionContext } from "../../PluginActionContext";
import { UIComponentTypes } from "api/PluginApi";
import GraphQLEditorForm from "./components/GraphQLEditor/GraphQLEditorForm";
import UQIEditorForm from "./components/UQIEditorForm";

const PluginActionForm = () => {
  useChangeActionCall();
  const { plugin } = usePluginActionContext();

  return (
    <Flex flex="1" overflow="hidden" p="spaces-2" w="100%">
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
