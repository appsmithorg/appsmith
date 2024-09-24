import React from "react";
import { Flex, Text } from "@appsmith/ads";

/**
 * Handy little styled component that can be used to render the title in the IDEHeader component
 * **/
const HeaderTitle = ({ title }: { title: string }) => {
  return (
    <Flex alignItems="center" height="100%" justifyContent="center">
      <Text isBold kind="body-m">
        {title}
      </Text>
    </Flex>
  );
};

export default HeaderTitle;
