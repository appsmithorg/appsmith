import React, { forwardRef } from "react";
import { FocusScope } from "@react-aria/focus";
import { useDOMRef } from "@react-spectrum/utils";
import type { DOMRef } from "@react-types/shared";
import { Item, Menu, MenuList } from "../../Menu";
import { useListState } from "@react-stately/list";

import styles from "./styles.module.css";
import { MoreIcon } from "./icons/MoreIcon";
import type { ActionGroupProps } from "./types";
import { useActionGroup } from "./useActionGroup";
import { IconButton } from "../../IconButton";
import { ActionGroupItem } from "./ActionGroupItem";

const _ActionGroup = <T extends object>(
  props: ActionGroupProps<T>,
  ref: DOMRef<HTMLDivElement>,
) => {
  const {
    color = "accent",
    density = "regular",
    isDisabled,
    onAction,
    orientation = "horizontal",
    overflowMode = "collapse",
    variant = "filled",
    ...others
  } = props;
  const domRef = useDOMRef(ref);
  const state = useListState({ ...props, suppressTextValueWarning: true });
  const { actionGroupProps, isMeasuring, visibleItems } = useActionGroup(
    props,
    state,
    domRef,
  );

  let children = [...state.collection];
  const menuChildren = children.slice(visibleItems);
  children = children.slice(0, visibleItems);

  const style = {
    flexBasis: isMeasuring ? "100%" : undefined,
    display: "flex",
  };

  return (
    <FocusScope>
      <div
        style={{
          ...style,
        }}
      >
        <div
          className={styles.actionGroup}
          data-density={density ? density : undefined}
          data-orientation={orientation}
          data-overflow={overflowMode}
          ref={domRef}
          {...actionGroupProps}
          {...others}
        >
          {children.map((item) => {
            return (
              <ActionGroupItem
                color={color}
                icon={item.props.icon}
                iconPosition={item.props.iconPosition}
                isDisabled={
                  Boolean(state.disabledKeys.has(item.key)) || isDisabled
                }
                item={item}
                key={item.key}
                onPress={() => onAction?.(item.key)}
                state={state}
                variant={variant}
              />
            );
          })}
          {menuChildren?.length > 0 && (
            <Menu>
              <IconButton
                color={color}
                icon={MoreIcon}
                size="large"
                variant={variant}
              />
              <MenuList>
                {menuChildren.map((item) => (
                  <Item data-color={item.props.color} key={item.key}>
                    {item.rendered}
                  </Item>
                ))}
              </MenuList>
            </Menu>
          )}
        </div>
      </div>
    </FocusScope>
  );
};

export const ActionGroup = forwardRef(_ActionGroup);
