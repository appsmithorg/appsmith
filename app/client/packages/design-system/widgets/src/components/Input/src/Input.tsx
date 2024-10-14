import clsx from "clsx";
import React, { forwardRef, useState } from "react";
import { getTypographyClassName } from "@appsmith/wds-theming";
import { IconButton, Spinner, type IconProps } from "@appsmith/wds";
import { Group, Input as HeadlessInput } from "react-aria-components";

import styles from "./styles.module.css";
import type { InputProps } from "./types";

function _Input(props: InputProps, ref: React.Ref<HTMLInputElement>) {
  const {
    defaultValue,
    isLoading,
    isReadOnly,
    prefix,
    size,
    suffix: suffixProp,
    type,
    value,
    ...rest
  } = props;
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const isEmpty = !Boolean(value) && !Boolean(defaultValue);

  const suffix = (() => {
    if (Boolean(isLoading)) return <Spinner />;

    if (type === "password") {
      const icon: IconProps["name"] = showPassword ? "eye-off" : "eye";

      return (
        <IconButton
          color="neutral"
          excludeFromTabOrder
          icon={icon}
          onPress={togglePasswordVisibility}
          size={size === "medium" ? "small" : "xSmall"}
          variant="ghost"
        />
      );
    }

    return suffixProp;
  })();

  return (
    <Group className={styles.inputGroup}>
      <HeadlessInput
        {...rest}
        className={clsx(styles.input, getTypographyClassName("body"))}
        data-readonly={Boolean(isReadOnly) ? true : undefined}
        data-size={Boolean(size) ? size : undefined}
        defaultValue={defaultValue}
        ref={ref}
        type={showPassword ? "text" : type}
        value={isEmpty && Boolean(isReadOnly) ? "—" : value}
      />
      {Boolean(prefix) && <span data-input-prefix>{prefix}</span>}
      {Boolean(suffix) && <span data-input-suffix>{suffix}</span>}
    </Group>
  );
}

export const Input = forwardRef(_Input);
