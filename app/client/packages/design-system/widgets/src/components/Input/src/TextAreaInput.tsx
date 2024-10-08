import clsx from "clsx";
import { Spinner } from "@appsmith/wds";
import React, { forwardRef } from "react";
import { getTypographyClassName } from "@appsmith/wds-theming";
import { Group, TextArea as HeadlessTextArea } from "react-aria-components";

import styles from "./styles.module.css";
import type { TextAreaInputProps } from "./types";

function _TextAreaInput(
  props: TextAreaInputProps,
  ref: React.Ref<HTMLTextAreaElement>,
) {
  const {
    defaultValue,
    isLoading,
    isReadOnly,
    prefix,
    rows,
    size,
    suffix: suffixProp,
    value,
    ...rest
  } = props;
  const isEmpty = !Boolean(value) && !Boolean(defaultValue);

  const suffix = (() => {
    if (Boolean(isLoading)) return <Spinner />;

    return suffixProp;
  })();

  return (
    <Group className={styles.inputGroup}>
      <HeadlessTextArea
        {...rest}
        className={clsx(styles.input, getTypographyClassName("body"))}
        data-readonly={Boolean(isReadOnly) ? true : undefined}
        data-size={Boolean(size) ? size : undefined}
        defaultValue={defaultValue}
        ref={ref}
        rows={Boolean(rows) ? rows : undefined}
        value={isEmpty && Boolean(isReadOnly) ? "—" : value}
      />
      {Boolean(prefix) && <span data-input-prefix>{prefix}</span>}
      {Boolean(suffix) && <span data-input-suffix>{suffix}</span>}
    </Group>
  );
}

export const TextAreaInput = forwardRef(_TextAreaInput);
