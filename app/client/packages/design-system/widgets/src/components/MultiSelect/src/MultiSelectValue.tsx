import clsx from "clsx";
import { type Selection, Button } from "react-aria-components";
import { useResizeObserver, useValueEffect } from "@react-aria/utils";
import React, { useCallback, useLayoutEffect, useMemo, useRef } from "react";

import { Icon } from "../../Icon";
import { Text } from "../../Text";
import { Spinner } from "../../Spinner";
import { selectStyles } from "../../Select";
import { textInputStyles } from "../../Input";

import styles from "./styles.module.css";
import type { MultiSelectProps } from "./types";
interface MultiSelectValueProps {
  excludeFromTabOrder?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  selectedKeys?: Selection;
  items?: Iterable<{ label: string; value: string }>;
  placeholder?: string;
  size?: MultiSelectProps<object>["size"];
  triggerRef: React.RefObject<HTMLButtonElement>;
  isInvalid?: boolean;
}

const MultiSelectValue: React.FC<MultiSelectValueProps> = ({
  excludeFromTabOrder,
  isDisabled,
  isInvalid,
  isLoading,
  items,
  placeholder,
  selectedKeys = new Set(),
  size,
  triggerRef,
}) => {
  const domRef = useRef<HTMLSpanElement>(null);
  const selectedItems = useMemo(() => {
    return [...selectedKeys].map((key) =>
      items ? Array.from(items).find((item) => item.value === key) : undefined,
    );
  }, [items, selectedKeys]);

  const totalItems = Array.from(selectedKeys).length;

  const [{ visibleItems }, setVisibleItems] = useValueEffect({
    visibleItems: totalItems,
  });

  const updateOverflow = useCallback(() => {
    const computeVisibleItems = (visibleItems: number) => {
      if (domRef.current) {
        const containerSize = domRef.current.getBoundingClientRect().width;
        const listItems = Array.from(
          domRef.current.children,
        ) as HTMLLIElement[];
        const ellipisisItem = listItems.pop();
        const ellipisisItemWidth =
          ellipisisItem?.getBoundingClientRect().width ?? 0;
        let calculatedSize = 0;
        let newVisibleItems = 0;

        for (const item of listItems) {
          const itemWidth = item.getBoundingClientRect().width;

          calculatedSize += itemWidth;

          if (
            calculatedSize <= containerSize &&
            calculatedSize + ellipisisItemWidth < containerSize
          ) {
            newVisibleItems++;
          } else {
            break;
          }
        }

        return newVisibleItems;
      }

      return visibleItems;
    };

    setVisibleItems(function* () {
      yield {
        visibleItems: totalItems,
      };

      const newVisibleItems = computeVisibleItems(totalItems);
      const isMeasuring = newVisibleItems < totalItems && newVisibleItems > 0;

      yield {
        visibleItems: newVisibleItems,
      };

      if (isMeasuring) {
        yield {
          visibleItems: computeVisibleItems(newVisibleItems),
        };
      }
    });
  }, [domRef, selectedKeys, setVisibleItems]);

  const parentRef = useMemo(
    () => ({
      get current() {
        return triggerRef.current?.parentElement;
      },
    }),
    [triggerRef],
  );

  useResizeObserver({
    ref: parentRef,
    onResize: updateOverflow,
  });

  useLayoutEffect(updateOverflow, [updateOverflow, selectedKeys]);

  return (
    <Button
      className={clsx(
        textInputStyles.input,
        selectStyles.selectTriggerButton,
        styles.multiSelectValue,
      )}
      data-invalid={Boolean(isInvalid) ? "" : undefined}
      data-size={size}
      excludeFromTabOrder={excludeFromTabOrder}
      isDisabled={isDisabled}
      type="button"
    >
      <span
        data-placeholder={visibleItems === 0 ? "" : undefined}
        data-select-text
        ref={domRef}
      >
        {selectedItems.length === 0 && (
          <Text color="neutral-subtle">{placeholder}</Text>
        )}
        {[...selectedItems].slice(0, visibleItems).map((item, index) => (
          <Text className={styles.selectedItemLabel} key={item?.value}>
            {item?.label}
            {index < visibleItems - 1 ? ",\u00A0" : ""}
          </Text>
        ))}
        {/* we are resevering space for 7 characters which describes "...+999" text */}
        <Text className={styles.ellipsisText}>
          {visibleItems < totalItems && <>...+{totalItems - visibleItems}</>}
        </Text>
      </span>
      <span data-input-suffix>
        {Boolean(isLoading) ? (
          <Spinner />
        ) : (
          <Icon name="chevron-down" size="medium" />
        )}
      </span>
    </Button>
  );
};

export default MultiSelectValue;
