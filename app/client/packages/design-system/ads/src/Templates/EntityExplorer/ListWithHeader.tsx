import React from "react";
import { ListHeaderContainer } from "./styles";
import { Text } from "../../Text";
import { Flex } from "../../Flex";

interface Props {
  headerText: string;
  headerControls?: React.ReactNode;
  maxHeight?: string;
  headerClassName?: string;
  children: React.ReactNode | React.ReactNode[];
}

export const ListWithHeader = (props: Props) => {
  return (
    <Flex
      flexDirection="column"
      justifyContent="center"
      maxHeight={props.maxHeight}
      overflow="hidden"
    >
      <ListHeaderContainer className={props.headerClassName}>
        <Text kind="heading-xs">{props.headerText}</Text>
        {props.headerControls}
      </ListHeaderContainer>
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
    </Flex>
  );
};
