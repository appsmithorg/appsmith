import React, { forwardRef } from "react";
import { FocusScope } from "@react-aria/focus";
import { useDOMRef } from "@react-spectrum/utils";
import { useListState } from "@react-stately/list";
import { InlineButton } from "./InlineButton";
import { useInlineButtons } from "./useInlineButtons";
import { Item } from "@react-stately/collections";
import styles from "./styles.module.css";
import type { CollectionChildren, DOMRef } from "@react-types/shared";
import type { InlineButtonsItem, InlineButtonsProps } from "./types";

interface InlineButtonsInnerProps<T> extends InlineButtonsProps<T> {
  children?: CollectionChildren<T>;
}

const _InlineButtonsInner = <T extends InlineButtonsItem>(
  props: InlineButtonsInnerProps<T>,
  ref: DOMRef<HTMLDivElement>,
) => {
  const {
    color = "accent",
    excludeFromTabOrder = false,
    isDisabled,
    onAction,
    size = "medium",
    variant = "filled",
  } = props;
  const domRef = useDOMRef(ref);
  const state = useListState({ ...props, suppressTextValueWarning: true });
  const { inlineButtonsProps, orientation } = useInlineButtons(
    props,
    state,
    domRef,
  );

  const children = [...state.collection];

  return (
    <FocusScope>
      <div
        className={styles.inlineButtons}
        data-orientation={orientation}
        ref={domRef}
        {...inlineButtonsProps}
      >
        {children.map((item) => {
          if (Boolean(item.props.isSeparator)) {
            return <div data-separator="" key={item.key} />;
          }

          return (
            <InlineButton
              color={item.props.color ?? color}
              excludeFromTabOrder={excludeFromTabOrder}
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

const InlineButtonsInner = forwardRef(_InlineButtonsInner);

const _InlineButtons = <T extends InlineButtonsItem>(
  props: InlineButtonsProps<T>,
  ref: DOMRef<HTMLDivElement>,
) => {
  const { items, ...rest } = props;

  return (
    <InlineButtonsInner items={items} {...rest} ref={ref}>
      {(item) => <Item {...item}>{item.label}</Item>}
    </InlineButtonsInner>
  );
};

export const InlineButtons = forwardRef(_InlineButtons);
