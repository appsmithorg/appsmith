import React, { useState } from "react";
import type { GroupedListProps } from "./types";
import { DEFAULT_GROUP_LIST_SIZE } from "./constants";
import { Flex, List, Text } from "design-system";
import styled from "styled-components";

interface GroupProps {
  group: GroupedListProps;
}

const StyledList = styled(List)`
  padding: 0;
  gap: 0;

  & .ds-load-more .ads-v2-listitem__title {
    --color: var(--ads-v2-color-fg-subtle);
  }
  & .ads-v2-listitem__wrapper .ads-v2-listitem__idesc {
    opacity: 0;
  }

  & .ads-v2-listitem__wrapper:hover .ads-v2-listitem__idesc {
    opacity: 1;
  }
`;

const Group: React.FC<GroupProps> = ({ group }) => {
  const [visibleItems, setVisibleItems] = useState<number>(
    DEFAULT_GROUP_LIST_SIZE,
  );
  const { className, groupTitle } = group;
  const items = group.items.slice(0, visibleItems);
  const hasMoreItems = group.items.length > visibleItems;

  const handleLoadMore = () => {
    setVisibleItems(group.items.length);
  };

  if (hasMoreItems) {
    items.push({
      title: "Load more...",
      description: "",
      descriptionType: "inline",
      onClick: handleLoadMore,
      className: "ds-load-more",
    });
  }

  // TODO: try to avoid this
  if (hasMoreItems && groupTitle === "Datasources") {
    items.push(group.items[group.items.length - 1]);
  }

  return (
    <Flex
      borderBottom="1px solid var(--ads-v2-color-border-muted)"
      className="groups-list-group"
      flexDirection="column"
      key={groupTitle}
      pb="spaces-3"
    >
      {groupTitle ? (
        <Text
          className="pr-[var(--ads-v2-spaces-3)] py-[var(--ads-v2-spaces-1)]"
          color="var(--ads-v2-color-fg-muted)"
          kind="body-s"
        >
          {groupTitle}
        </Text>
      ) : null}
      <StyledList className={className} items={items} />
    </Flex>
  );
};

export { Group };
