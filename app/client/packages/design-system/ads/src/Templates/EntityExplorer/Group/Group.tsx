import React, { useMemo, useState } from "react";
import type { GroupProps } from "./Group.types";
import { DEFAULT_GROUP_LIST_SIZE } from "./Group.constants";
import { Text } from "../../../Text";
import { LoadMore, StyledList, StyledGroup } from "./Group.styles";
import { ListItem } from "../../../List";

interface Props {
  group: GroupProps;
}

const Group: React.FC<Props> = ({ group }) => {
  const { className, groupTitle, items: groupItems } = group;
  const [visibleItemsCount, setVisibleItemsCount] = useState<number>(
    DEFAULT_GROUP_LIST_SIZE,
  );

  const hasMoreItems = useMemo(
    () => groupItems.length > visibleItemsCount,
    [groupItems, visibleItemsCount],
  );

  const { addConfig, items } = useMemo(() => {
    const items = groupItems.slice(0, visibleItemsCount);
    let addConfig = undefined;

    if (
      groupTitle === "Datasources" &&
      groupItems[groupItems.length - 1].title === "New datasource"
    ) {
      addConfig = groupItems[groupItems.length - 1];

      if (groupItems.length <= visibleItemsCount) {
        items.splice(items.length - 1);
      }
    }

    return { addConfig, items };
  }, [groupItems, visibleItemsCount]);

  const handleLoadMore = () => {
    setVisibleItemsCount(groupItems.length);
  };

  return (
    <StyledGroup
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
      {hasMoreItems && (
        <LoadMore onClick={handleLoadMore}>Load more...</LoadMore>
      )}
      {addConfig && (
        <ListItem
          onClick={addConfig?.onClick}
          startIcon={addConfig?.startIcon}
          title={addConfig?.title}
        />
      )}
    </StyledGroup>
  );
};

export { Group };
