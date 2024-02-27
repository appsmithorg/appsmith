import React, { forwardRef } from "react";
import { FocusScope } from "@react-aria/focus";
import { useDOMRef } from "@react-spectrum/utils";
import type { DOMRef } from "@react-types/shared";
import { useListState } from "@react-stately/list";

import styles from "./styles.module.css";
import type { ButtonGroupItemProps, ButtonGroupProps } from "./types";
import { ButtonGroupItem } from "./ButtonGroupItem";

const _ButtonGroup = <T extends object>(
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

  const children = [...state.collection];

  return (
    <FocusScope>
      <div className={styles.container}>
        <div
          className={styles.buttonGroup}
          data-density={Boolean(density) ? density : undefined}
          data-orientation={orientation}
          data-overflow={overflowMode}
          ref={domRef}
          {...others}
        >
          {children.map((item) => {
            if (Boolean(item.props.isSeparator)) {
              return <div data-separator="" key={item.key} />;
            }

            return (
              <ButtonGroupItem
                color={
                  (item.props.color as ButtonGroupItemProps<object>["color"]) ??
                  color
                }
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
                variant={
                  (item.props
                    .variant as ButtonGroupItemProps<object>["variant"]) ??
                  variant
                }
              />
            );
          })}
        </div>
      </div>
    </FocusScope>
  );
};

export const ButtonGroup = forwardRef(_ButtonGroup);
