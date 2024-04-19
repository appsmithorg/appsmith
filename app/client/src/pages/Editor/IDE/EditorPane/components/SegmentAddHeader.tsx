import React from "react";
import { Button, Flex, Text } from "design-system";
import { createMessage } from "@appsmith/constants/messages";
import styled from "styled-components";

interface Props {
  titleMessage: () => string;
  onCloseClick: () => void;
}

const Container = styled(Flex)`
  padding-right: var(--ads-v2-spaces-2);
  background-color: var(--ads-v2-color-gray-50);
`;

const SegmentAddHeader = (props: Props) => {
  return (
    <Container
      alignItems="center"
      borderBottom={"1px solid var(--ads-v2-color-border)"}
      justifyContent="space-between"
      px="spaces-4"
      py="spaces-2"
    >
      <Text color="var(--ads-v2-color-fg)" kind="heading-xs">
        {createMessage(props.titleMessage)}
      </Text>
      <Button
        aria-label="Close pane"
        data-testid="t--add-pane-close-icon"
        isIconButton
        kind={"tertiary"}
        onClick={props.onCloseClick}
        size={"sm"}
        startIcon={"close-line"}
      />
    </Container>
  );
};

export default SegmentAddHeader;
