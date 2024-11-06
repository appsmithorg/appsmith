import React from "react";
import { Flex } from "@appsmith/ads";
import { useChangeActionCall } from "./hooks/useChangeActionCall";
import { usePluginActionContext } from "../../PluginActionContext";
import { UIComponentTypes } from "api/PluginApi";
import APIEditorForm from "./components/ApiEditor";
import GraphQLEditorForm from "./components/GraphQLEditor";
import UQIEditorForm from "./components/UQIEditor";

const PluginActionForm = () => {
  useChangeActionCall();
  const { plugin } = usePluginActionContext();

  return (
    <Flex flex="1" overflow="hidden" p="spaces-4" pt="spaces-0" w="100%">
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
