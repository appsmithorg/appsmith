import React from "react";
import APIEditorForm from "./components/APIEditorForm";
import { Flex } from "@appsmith/ads";
import { useChangeActionCall } from "./hooks/useChangeActionCall";

const PluginActionForm = () => {
  useChangeActionCall();

  return (
    <Flex p="spaces-2" w="100%">
      <APIEditorForm />
    </Flex>
  );
};

export default PluginActionForm;
