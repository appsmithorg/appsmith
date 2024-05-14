import React, { forwardRef } from "react";
import { FocusScope } from "@react-aria/focus";
import { useDOMRef } from "@react-spectrum/utils";
import { Button, Menu } from "@design-system/widgets";
import { useListState } from "@react-stately/list";
import { MenuTrigger } from "react-aria-components";
import { ActionGroupButton } from "./ActionGroupButton";
import { useActionGroup } from "./useActionGroup";
import styles from "./styles.module.css";
import { Item } from "@react-stately/collections";
import type { ActionGroupItem, ActionGroupProps } from "./types";
import type { DOMRef, CollectionChildren } from "@react-types/shared";

interface ActionGroupInnerProps<T> extends ActionGroupProps<T> {
  children?: CollectionChildren<T>;
}

const _ActionGroupInner = <T extends ActionGroupItem>(
  props: ActionGroupInnerProps<T>,
  ref: DOMRef<HTMLDivElement>,
) => {
  const {
    alignment = "start",
    color = "accent",
    density = "regular",
    isDisabled,
    onAction,
    overflowMode = "collapse",
    size = "medium",
    variant = "filled",
    ...others
  } = props;
  const domRef = useDOMRef(ref);
  const state = useListState({ ...props, suppressTextValueWarning: true });
  const { actionGroupProps, visibleItems } = useActionGroup(
    props,
    state,
    domRef,
  );

  let children = [...state.collection];
  const menuChildren = (props.items as ActionGroupItem[]).slice(visibleItems);
  children = children.slice(0, visibleItems);

  return (
    <FocusScope>
      <div
        className={styles.actionGroup}
        data-alignment={alignment}
        data-density={Boolean(density) ? density : undefined}
        data-overflow={overflowMode}
        ref={domRef}
        {...actionGroupProps}
        {...others}
      >
        {children.map((item) => {
          if (Boolean(item.props.isSeparator)) {
            return <div data-separator="" key={item.key} role="separator" />;
          }

          return (
            <ActionGroupButton
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
          <MenuTrigger>
            <Button
              color={color}
              data-action-group-menu
              icon="menu-2"
              variant={variant}
            />
            <Menu items={menuChildren} onAction={onAction} />
          </MenuTrigger>
        )}
      </div>
    </FocusScope>
  );
};

const ActionGroupInner = forwardRef(_ActionGroupInner);

const _ActionGroup = <T extends ActionGroupItem>(
  props: Omit<ActionGroupProps<T>, "children">,
  ref: DOMRef<HTMLDivElement>,
) => {
  const { items, ...rest } = props;

  return (
    <ActionGroupInner items={items} {...rest} ref={ref}>
      {(item) => <Item {...item}>{item.label}</Item>}
    </ActionGroupInner>
  );
};

export const ActionGroup = forwardRef(_ActionGroup);
