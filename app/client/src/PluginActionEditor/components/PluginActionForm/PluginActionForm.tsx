import React from "react";
import APIEditorForm from "./components/APIEditorForm";
import { Flex } from "@appsmith/ads";
import { useChangeActionCall } from "./hooks/useChangeActionCall";
import { usePluginActionContext } from "../../PluginActionContext";
import { UIComponentTypes } from "api/PluginApi";

const PluginActionForm = () => {
  useChangeActionCall();
  const { plugin } = usePluginActionContext();

  return (
    <Flex p="spaces-2" w="100%">
      {plugin.uiComponent === UIComponentTypes.ApiEditorForm ? (
        <APIEditorForm />
      ) : null}
    </Flex>
  );
};

export default PluginActionForm;
