import React from "react";
import { Flex, Text } from "design-system";

const PagesSection = () => {
  return (
    <Flex
      alignItems={"center"}
      // 36px is the height of MinimalSegment
      height={"calc(100% - 36px)"}
      justifyContent={"center"}
    >
      <Text isBold kind={"body-m"}>
        Pages
      </Text>
    </Flex>
  );
};

export { PagesSection };
