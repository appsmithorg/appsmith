import React from "react";
import { Flex, Text } from "design-system";
import { getFloatingPaneSelectedWidget } from "./selectors";
import { useSelector } from "react-redux";

const Toolbar = () => {
  const widget = useSelector(getFloatingPaneSelectedWidget);
  return (
    <Flex flexDirection="column">
      <Text>{widget.widgetName}</Text>
    </Flex>
  );
};

export default Toolbar;
