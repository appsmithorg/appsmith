import React from "react";
import APIEditorForm from "./components/APIEditorForm";
import { Flex } from "@appsmith/ads";

const PluginActionForm = () => {
  return (
    <Flex p="spaces-2" w="100%">
      <APIEditorForm />
    </Flex>
  );
};

export default PluginActionForm;
