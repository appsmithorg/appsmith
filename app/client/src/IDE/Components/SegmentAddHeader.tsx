import React from "react";
import { Flex, Text } from "@appsmith/ads";
import { createMessage } from "ee/constants/messages";

interface Props {
  titleMessage: () => string;
  onCloseClick?: () => void;
}

const SegmentAddHeader = (props: Props) => {
  return (
    <Flex
      alignItems="center"
      backgroundColor="var(--ads-v2-color-white)"
      justifyContent="space-between"
    >
      <Text color="var(--ads-v2-color-fg)" kind="heading-xs">
        {createMessage(props.titleMessage)}
      </Text>
    </Flex>
  );
};

export default SegmentAddHeader;
