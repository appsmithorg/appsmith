import React, { forwardRef } from "react";
import { FocusScope } from "@react-aria/focus";
import { useDOMRef } from "@react-spectrum/utils";
import type { DOMRef } from "@react-types/shared";
import { Item, Menu, MenuList } from "../../Menu";
import { useListState } from "@react-stately/list";

import styles from "./styles.module.css";
import type { ButtonGroupProps } from "../../../index";
import { useActionGroup } from "./useActionGroup";
import { IconButton } from "../../IconButton";
import { ActionGroupItem } from "./ActionGroupItem";

const _ActionGroup = <T extends object>(
  props: ButtonGroupProps<T>,
  ref: DOMRef<HTMLDivElement>,
) => {
  const {
    color = "accent",
    density = "regular",
    isDisabled,
    onAction,
    orientation = "horizontal",
    overflowMode = "collapse",
    size = "medium",
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
          data-density={Boolean(density) ? density : undefined}
          data-orientation={orientation}
          data-overflow={overflowMode}
          ref={domRef}
          {...actionGroupProps}
          {...others}
        >
          {children.map((item) => {
            if (Boolean(item.props.isSeparator)) {
              return <div data-separator="" key={item.key} />;
            }

            return (
              <ActionGroupItem
                color={color}
                icon={item.props.icon}
                iconPosition={item.props.iconPosition}
                isDisabled={
                  Boolean(state.disabledKeys.has(item.key)) || isDisabled
                }
                isLoading={item.props.isLoading}
                item={item}
                key={item.key}
                onPress={() => onAction?.(item.key)}
                size={Boolean(size) ? size : undefined}
                state={state}
                variant={variant}
              />
            );
          })}
          {menuChildren?.length > 0 && (
            <Menu onAction={onAction}>
              <IconButton color={color} icon="dots" variant={variant} />
              <MenuList>
                {menuChildren.map((item) => (
                  <Item isSeparator={item.props.isSeparator} key={item.key}>
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
