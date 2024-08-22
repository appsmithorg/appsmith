import React from "react";

import styled from "styled-components";

import type { FlexProps } from "@appsmith/ads";
import { Flex } from "@appsmith/ads";

import { Group } from "./Group";
import type { GroupedListProps } from "./types";

interface Props {
  groups: GroupedListProps[];
  flexProps?: FlexProps;
}

const StyledFlex = styled(Flex)`
  & .groups-list-group:last-child {
    border-bottom: none;
  }
`;

const GroupedList = (props: Props) => {
  return (
    <StyledFlex
      flex="1"
      flexDirection="column"
      gap="spaces-4"
      overflowY="auto"
      {...props.flexProps}
    >
      {props.groups.map((group) => (
        <Group group={group} key={group.groupTitle} />
      ))}
    </StyledFlex>
  );
};

export default GroupedList;
