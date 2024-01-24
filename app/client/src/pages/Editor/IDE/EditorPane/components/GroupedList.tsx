import React from "react";
import styled from "styled-components";
import type { ListItemProps } from "design-system";
import { Flex, List, Text } from "design-system";

const StyledList = styled(List)`
  padding: 0;
  gap: 0;
`;

export type GroupedListProps = Array<{
  groupTitle?: string;
  className: string;
  items: ListItemProps[];
}>;

interface Props {
  groups: GroupedListProps;
}

const GroupedList = (props: Props) => {
  return (
    <Flex
      flexDirection="column"
      gap="spaces-4"
      overflow="scroll"
      pr="spaces-2"
      px="spaces-3"
    >
      {props.groups.map((group) => (
        <Flex flexDirection="column" key={group.groupTitle}>
          {group.groupTitle ? (
            <Text
              className="px-[var(--ads-v2-spaces-3)] py-[var(--ads-v2-spaces-1)]"
              color="var(--ads-v2-color-fg-muted)"
              kind="body-s"
            >
              {group.groupTitle}
            </Text>
          ) : null}
          <StyledList className={group.className} items={group.items} />
        </Flex>
      ))}
    </Flex>
  );
};

export default GroupedList;
