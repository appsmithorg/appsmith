import React from "react";
import { ListHeaderContainer, ListItemContainer } from "./styles";
import { Text } from "../../Text";
import { Flex } from "../../Flex";

interface Props {
  headerText: string;
  headerControls?: React.ReactNode;
  maxHeight?: string;
  children: React.ReactNode[];
}

export const ListWithHeader = (props: Props) => {
  return (
    <Flex
      flexDirection="column"
      justifyContent="center"
      maxHeight={props.maxHeight}
      overflow="hidden"
    >
      <ListHeaderContainer className="pages">
        <Text kind="heading-xs">{props.headerText}</Text>
        {props.headerControls}
      </ListHeaderContainer>
      <ListItemContainer>
        <Flex
          alignItems="center"
          flex="1"
          flexDirection="column"
          overflow="auto"
          px="spaces-2"
          width="100%"
        >
          {props.children}
        </Flex>
      </ListItemContainer>
    </Flex>
  );
};
