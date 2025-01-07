import React from "react";
import { Flex, Group, type GroupProps, type FlexProps } from "@appsmith/ads";
import styled from "styled-components";

interface Props {
  groups: GroupProps[];
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
