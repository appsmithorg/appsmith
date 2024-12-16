import clsx from "clsx";
import { mergeRefs } from "@react-aria/utils";
import React, { forwardRef, useRef, useState } from "react";
import { getTypographyClassName } from "@appsmith/wds-theming";
import { IconButton, Spinner, type IconProps } from "@appsmith/wds";
import { Group, Input as HeadlessInput } from "react-aria-components";

import styles from "./styles.module.css";
import type { InputProps } from "./types";

function _Input(props: InputProps, ref: React.Ref<HTMLInputElement>) {
  const {
    className,
    defaultValue,
    inputGroupClassName,
    isLoading,
    isReadOnly,
    prefix,
    size,
    suffix: suffixProp,
    type,
    value,
    ...rest
  } = props;
  const localRef = useRef<HTMLInputElement>(null);
  const mergedRef = mergeRefs(ref, localRef);
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
    <Group className={clsx(styles.inputGroup, inputGroupClassName)}>
      {Boolean(prefix) && (
        <span data-input-prefix onClick={() => localRef.current?.focus()}>
          {prefix}
        </span>
      )}
      <HeadlessInput
        {...rest}
        className={clsx(
          styles.input,
          getTypographyClassName("body"),
          className,
        )}
        data-readonly={Boolean(isReadOnly) ? true : undefined}
        data-size={Boolean(size) ? size : undefined}
        defaultValue={defaultValue}
        ref={mergedRef}
        type={showPassword ? "text" : type}
        value={isEmpty && Boolean(isReadOnly) ? "—" : value}
      />
      {Boolean(suffix) && (
        <span data-input-suffix onClick={() => localRef.current?.focus()}>
          {suffix}
        </span>
      )}
    </Group>
  );
}

export const Input = forwardRef(_Input);
