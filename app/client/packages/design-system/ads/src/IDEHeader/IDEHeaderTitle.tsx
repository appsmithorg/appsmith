import React from "react";
import { Flex } from "../Flex";
import { Text } from "../Text";

/**
 * Handy little styled component that can be used to render the title in the IDEHeader component
 * **/
export const IDEHeaderTitle = ({ title }: { title: string }) => {
  return (
    <Flex alignItems="center" height="100%" justifyContent="center">
      <Text isBold kind="body-m">
        {title}
      </Text>
    </Flex>
  );
};
