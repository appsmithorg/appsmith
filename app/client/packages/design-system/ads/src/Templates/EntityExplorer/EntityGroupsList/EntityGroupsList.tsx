import React, { useMemo } from "react";
import { GroupsListWrapper, LoadMore } from "./EntityGroupsList.styles";
import type {
  EntityGroupProps,
  EntityGroupsListProps,
} from "./EntityGroupsList.types";
import { Flex } from "../../../Flex";
import { List, ListItem, type ListItemProps } from "../../../List";

const EntityGroupsList = <T,>(props: EntityGroupsListProps<T>) => {
  const { flexProps, groups } = props;

  return (
    <GroupsListWrapper
      flexDirection="column"
      gap="spaces-4"
      overflowY="auto"
      {...flexProps}
    >
      {groups.map((group) => (
        <EntityGroup group={group} key={group.groupTitle} />
      ))}
    </GroupsListWrapper>
  );
};

const EntityGroup = <T,>({ group }: { group: EntityGroupProps<T> }) => {
  const [visibleItemsCount, setVisibleItemsCount] = React.useState(5);

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
      borderBottom="1px solid var(--ads-v2-color-bg-border)"
      flexDirection={"column"}
      key={group.groupTitle}
      pb="spaces-3"
    >
      <List className={group.className} groupTitle={group.groupTitle}>
        {updatedGroup.items.map((item: T) =>
          group.renderList ? (
            group.renderList(item)
          ) : (
            <ListItem
              key={(item as ListItemProps)?.title}
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
