import React from "react";
import { Button, Flex, Text } from "design-system";
import { createMessage } from "@appsmith/constants/messages";
import { useSelector } from "react-redux";
import { getIsSideBySideEnabled } from "selectors/ideSelectors";

interface Props {
  titleMessage: () => string;
  onCloseClick?: () => void;
}

const SegmentAddHeader = (props: Props) => {
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  return (
    <Flex
      alignItems="center"
      backgroundColor={
        isSideBySideEnabled
          ? "var(--ads-v2-color-white)"
          : "var(--ads-v2-color-gray-50)"
      }
      justifyContent="space-between"
      pl="spaces-4"
      pr="spaces-2"
      py="spaces-2"
    >
      <Text color="var(--ads-v2-color-fg)" kind="heading-xs">
        {createMessage(props.titleMessage)}
      </Text>
      {isSideBySideEnabled ? null : (
        <Button
          aria-label="Close pane"
          data-testid="t--add-pane-close-icon"
          isIconButton
          kind={"secondary"}
          onClick={props.onCloseClick}
          size={"sm"}
          startIcon={"close-line"}
        />
      )}
    </Flex>
  );
};

export default SegmentAddHeader;
