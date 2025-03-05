import React, { useEffect, useMemo } from "react";
import { LoadMore } from "./EntityGroupsList.styles";
import type {
  EntityGroupProps,
  EntityGroupsListProps,
} from "./EntityGroupsList.types";
import { Flex } from "../../../Flex";
import { List, ListItem, type ListItemProps } from "../../../List";
import { Divider } from "../../../Divider";

const EntityGroupsList = <T,>(props: EntityGroupsListProps<T>) => {
  const { flexProps, groups, showDivider, visibleItems } = props;

  return (
    <Flex flexDirection="column" gap="spaces-4" overflowY="auto" {...flexProps}>
      {groups.map((group, index) => (
        <Flex flexDirection="column" gap="spaces-3" key={group.groupTitle}>
          <EntityGroup group={group} visibleItems={visibleItems} />
          {showDivider && index < groups.length - 1 && (
            <Divider
              style={{ borderColor: "var(--ads-v2-color-border-muted)" }}
            />
          )}
        </Flex>
      ))}
    </Flex>
  );
};

const EntityGroup = <T,>({
  group,
  visibleItems,
}: {
  group: EntityGroupProps<T>;
  visibleItems?: number;
}) => {
  const [visibleItemsCount, setVisibleItemsCount] = React.useState(
    visibleItems || group.items.length,
  );

  useEffect(() => {
    setVisibleItemsCount(visibleItems || group.items.length);
  }, [group.items.length, visibleItems]);

  const lazyLoading = useMemo(() => {
    return {
      visibleItemsCount,
      hasMore: visibleItemsCount < group.items.length,
      handleLoadMore: () => setVisibleItemsCount(group.items.length),
    };
  }, [visibleItemsCount, group.items.length]);

  const updatedGroup = lazyLoading.hasMore
    ? {
        ...group,
        items: group.items.slice(0, lazyLoading.visibleItemsCount),
      }
    : group;

  return (
    <Flex
      className="entity-group"
      flexDirection={"column"}
      key={group.groupTitle}
    >
      <List className={group.className} groupTitle={group.groupTitle}>
        {updatedGroup.items.map((item: T, index) =>
          group.renderList ? (
            group.renderList(item)
          ) : (
            <ListItem
              data-testid={`entity-group-item-${(item as ListItemProps)?.title}`}
              key={(item as ListItemProps)?.title || `item-${index}`}
              {...(item as ListItemProps)}
            />
          ),
        )}
      </List>
      {lazyLoading?.hasMore && (
        <LoadMore onClick={lazyLoading?.handleLoadMore} title="Load more..." />
      )}
      {group.addConfig && (
        <ListItem
          onClick={group.addConfig?.onClick}
          startIcon={group.addConfig?.icon}
          title={group.addConfig?.title}
        />
      )}
    </Flex>
  );
};

export { EntityGroup, EntityGroupsList };
