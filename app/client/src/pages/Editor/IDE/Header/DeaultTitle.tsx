import React from "react";
import { Flex, Text } from "design-system";

const DefaultTitle = ({ title }: { title: string }) => {
  return (
    <Flex alignItems={"center"} height={"100%"} justifyContent={"center"}>
      <Text isBold kind={"body-m"}>
        {title}
      </Text>
    </Flex>
  );
};

export { DefaultTitle };
