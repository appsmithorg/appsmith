import React, { useCallback } from "react";
import type { EntityListTreeProps } from "./EntityListTree.types";
import { Flex, Icon } from "../../..";
import { EntityItem } from "../";
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
    <Flex flex="1" flexDirection="column">
      {props.items.map((item) => (
        <Flex flex="1" flexDirection="column" key={item.id}>
          <EntityItemWrapper
            alignItems="center"
            data-depth={childrenDepth}
            data-selected={item.isSelected}
            flexDirection="row"
          >
            {item.children ? (
              <CollapseWrapper
                data-itemid={item.id}
                data-testid="entity-item-expand-icon"
                onClick={handleOnExpandClick}
              >
                <Icon
                  name={
                    item.isExpanded ? "arrow-down-s-line" : "arrow-right-s-line"
                  }
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
