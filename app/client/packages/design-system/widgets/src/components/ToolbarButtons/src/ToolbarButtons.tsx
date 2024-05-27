import React, { forwardRef } from "react";
import { Button, Menu } from "@design-system/widgets";
import { FocusScope } from "@react-aria/focus";
import { useDOMRef } from "@react-spectrum/utils";
import { useListState } from "@react-stately/list";
import { Item } from "@react-stately/collections";
import { MenuTrigger } from "react-aria-components";
import { ToolbarButton } from "./ToolbarButton";
import { useToolbarButtons } from "./useToolbarButtons";
import styles from "./styles.module.css";
import type { ToolbarButtonsItem, ToolbarButtonsProps } from "./types";
import type { DOMRef, CollectionChildren } from "@react-types/shared";

interface ToolbarButtonsInnerProps<T> extends ToolbarButtonsProps<T> {
  children?: CollectionChildren<T>;
}

const _ToolbarButtonsInner = <T extends ToolbarButtonsItem>(
  props: ToolbarButtonsInnerProps<T>,
  ref: DOMRef<HTMLDivElement>,
) => {
  const {
    alignment = "start",
    color = "accent",
    density = "regular",
    isDisabled,
    onAction,
    size = "medium",
    variant = "filled",
  } = props;
  const domRef = useDOMRef(ref);
  const state = useListState({ ...props, suppressTextValueWarning: true });
  const { toolbarButtonsProps, visibleItems } = useToolbarButtons(
    props,
    state,
    domRef,
  );

  let children = [...state.collection];
  const menuChildren = (props.items as ToolbarButtonsItem[]).slice(
    visibleItems,
  );
  children = children.slice(0, visibleItems);

  return (
    <FocusScope>
      <div
        className={styles.toolbarButtons}
        data-alignment={alignment}
        data-density={Boolean(density) ? density : undefined}
        ref={domRef}
        {...toolbarButtonsProps}
      >
        {children.map((item) => {
          if (Boolean(item.props.isSeparator)) {
            return <div data-separator="" key={item.key} role="separator" />;
          }

          return (
            <ToolbarButton
              color={color}
              icon={item.props.icon}
              iconPosition={item.props.iconPosition}
              isDisabled={
                Boolean(state.disabledKeys.has(item.key)) ||
                Boolean(item.props.isDisabled) ||
                isDisabled
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
              icon="dots"
              isDisabled={isDisabled}
              variant={variant}
            />
            <Menu {...props} items={menuChildren} />
          </MenuTrigger>
        )}
      </div>
    </FocusScope>
  );
};

const ToolbarButtonsInner = forwardRef(_ToolbarButtonsInner);

const _ToolbarButtons = <T extends ToolbarButtonsItem>(
  props: Omit<ToolbarButtonsProps<T>, "children">,
  ref: DOMRef<HTMLDivElement>,
) => {
  const { items, ...rest } = props;

  return (
    <ToolbarButtonsInner items={items} {...rest} ref={ref}>
      {(item) => <Item {...item}>{item.label}</Item>}
    </ToolbarButtonsInner>
  );
};

export const ToolbarButtons = forwardRef(_ToolbarButtons);
