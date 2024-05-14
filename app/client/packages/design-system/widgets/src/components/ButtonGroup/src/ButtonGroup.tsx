import React, { forwardRef } from "react";
import { FocusScope } from "@react-aria/focus";
import { useDOMRef } from "@react-spectrum/utils";
import { useListState } from "@react-stately/list";
import { ButtonGroupButton } from "./ButtonGroupButton";
import { useButtonGroup } from "./useButtonGroup";
import { Item } from "@react-stately/collections";
import styles from "./styles.module.css";
import type { CollectionChildren, DOMRef } from "@react-types/shared";
import type { ButtonGroupItem, ButtonGroupProps } from "./types";

interface ButtonGroupInnerProps<T> extends ButtonGroupProps<T> {
  children?: CollectionChildren<T>;
}

const _ButtonGroupInner = <T extends ButtonGroupItem>(
  props: ButtonGroupInnerProps<T>,
  ref: DOMRef<HTMLDivElement>,
) => {
  const {
    color = "accent",
    isDisabled,
    onAction,
    overflowMode = "collapse",
    size = "medium",
    variant = "filled",
    ...others
  } = props;
  const domRef = useDOMRef(ref);
  const state = useListState({ ...props, suppressTextValueWarning: true });
  const { buttonGroupProps, orientation } = useButtonGroup(
    props,
    state,
    domRef,
  );

  const children = [...state.collection];

  return (
    <FocusScope>
      <div
        className={styles.buttonGroup}
        data-orientation={orientation}
        data-overflow={overflowMode}
        ref={domRef}
        {...buttonGroupProps}
        {...others}
      >
        {children.map((item) => {
          if (Boolean(item.props.isSeparator)) {
            return <div data-separator="" key={item.key} />;
          }

          return (
            <ButtonGroupButton
              color={item.props.color ?? color}
              icon={item.props.icon}
              iconPosition={item.props.iconPosition}
              isDisabled={
                Boolean(state.disabledKeys.has(item.key)) ||
                Boolean(isDisabled) ||
                item.props.isDisabled
              }
              isLoading={item.props.isLoading}
              item={item}
              key={item.key}
              onPress={() => onAction?.(item.key)}
              size={Boolean(size) ? size : undefined}
              state={state}
              variant={item.props.variant ?? variant}
            />
          );
        })}
      </div>
    </FocusScope>
  );
};

const ButtonGroupInner = forwardRef(_ButtonGroupInner);

const _ButtonGroup = <T extends ButtonGroupItem>(
  props: ButtonGroupProps<T>,
  ref: DOMRef<HTMLDivElement>,
) => {
  const { items, ...rest } = props;

  return (
    <ButtonGroupInner items={items} {...rest} ref={ref}>
      {(item) => <Item {...item}>{item.label}</Item>}
    </ButtonGroupInner>
  );
};

export const ButtonGroup = forwardRef(_ButtonGroup);
