import React, { useCallback } from "react";
import type { EntityListTreeProps } from "./EntityListTree.types";
import { Flex } from "../../../Flex";
import { Icon } from "../../../Icon";
import { EntityItem } from "../EntityItem";
import {
  CollapseSpacer,
  PaddingOverrider,
  CollapseWrapper,
  EntityItemWrapper,
} from "./EntityListTree.styles";

export function EntityListTree(props: EntityListTreeProps) {
  const { onItemExpand } = props;

  const handleOnExpandClick = useCallback(
    (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
      // Stop the event from bubbling up to the parent to avoid selection of the item
      event.stopPropagation();
      const id = event.currentTarget.getAttribute("data-itemid");

      if (id) {
        onItemExpand(id);
      }
    },
    [onItemExpand],
  );

  const currentDepth = props.depth || 0;
  const childrenDepth = currentDepth + 1;

  return (
    <Flex
      flex="1"
      flexDirection="column"
      role={currentDepth == 0 ? "tree" : undefined}
    >
      {props.items.map((item) => (
        <Flex flex="1" flexDirection="column" key={item.id}>
          <EntityItemWrapper
            alignItems="center"
            aria-expanded={item.isExpanded}
            aria-level={currentDepth}
            aria-selected={item.isSelected}
            data-depth={currentDepth}
            data-disabled={item.isDisabled || false}
            data-selected={item.isSelected}
            flexDirection="row"
            role="treeitem"
          >
            {item.children && item.children.length ? (
              <CollapseWrapper
                data-itemid={item.id}
                data-testid="entity-item-expand-icon"
                onClick={handleOnExpandClick}
              >
                <Icon
                  name={
                    item.isExpanded ? "arrow-down-s-line" : "arrow-right-s-line"
                  }
                  size="md"
                />
              </CollapseWrapper>
            ) : (
              <CollapseSpacer />
            )}
            <PaddingOverrider>
              <EntityItem {...item} />
            </PaddingOverrider>
          </EntityItemWrapper>
          {item.children && item.isExpanded ? (
            <EntityListTree
              depth={childrenDepth}
              items={item.children}
              onItemExpand={onItemExpand}
            />
          ) : null}
        </Flex>
      ))}
    </Flex>
  );
}
