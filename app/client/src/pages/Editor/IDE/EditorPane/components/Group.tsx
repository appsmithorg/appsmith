import React, { useMemo, useState } from "react";
import type { GroupedListProps } from "./types";
import { DEFAULT_GROUP_LIST_SIZE } from "./constants";
import { Flex, List, Text } from "@appsmith/ads";
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
  & .ads-v2-listitem .ads-v2-listitem__idesc {
    opacity: 0;
  }

  & .ads-v2-listitem:hover .ads-v2-listitem__idesc {
    opacity: 1;
  }
`;

const Group: React.FC<GroupProps> = ({ group }) => {
  const [visibleItemsCount, setVisibleItemsCount] = useState<number>(
    DEFAULT_GROUP_LIST_SIZE,
  );
  const { className, groupTitle, items: groupItems } = group;

  const items = useMemo(() => {
    const items = groupItems.slice(0, visibleItemsCount);
    const hasMoreItems = groupItems.length > visibleItemsCount;

    const handleLoadMore = () => {
      setVisibleItemsCount(groupItems.length);
    };

    if (hasMoreItems) {
      items.push({
        title: "Load more...",
        onClick: handleLoadMore,
        className: "ds-load-more",
      });
    }

    // TODO: try to avoid this
    if (hasMoreItems && groupTitle === "Datasources") {
      items.push(groupItems[groupItems.length - 1]);
    }

    return items;
  }, [groupItems, visibleItemsCount, groupTitle]);

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
          className="px-0 py-[var(--ads-v2-spaces-1)]"
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
