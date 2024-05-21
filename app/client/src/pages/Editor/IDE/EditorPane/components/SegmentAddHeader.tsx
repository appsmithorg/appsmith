import React from "react";
import { Flex, Text } from "design-system";
import { createMessage } from "@appsmith/constants/messages";

interface Props {
  titleMessage: () => string;
}

const SegmentAddHeader = (props: Props) => {
  return (
    <Flex alignItems="center" justifyContent="space-between" p="spaces-3">
      <Text color="var(--ads-v2-color-fg)" kind="heading-xs">
        {createMessage(props.titleMessage)}
      </Text>
    </Flex>
  );
};

export default SegmentAddHeader;
