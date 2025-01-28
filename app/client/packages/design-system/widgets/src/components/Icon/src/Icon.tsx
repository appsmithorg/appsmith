import clsx from "clsx";
import type { Component, Ref } from "react";
import React, { Suspense, forwardRef, lazy, useMemo } from "react";

import { ICONS } from "./icons";
import styles from "./styles.module.css";
import type { IconProps } from "./types";
import { FallbackIcon } from "./FallbackIcon";

const _Icon = (props: IconProps, ref: Ref<Component>) => {
  const { className, color, name, size = "medium", ...rest } = props;

  const Icon = useMemo(() => {
    const pascalName = ICONS[name];

    return lazy(async () =>
      import("@tabler/icons-react").then((module) => {
        if (pascalName in module) {
          return {
            default: module[pascalName] as React.ComponentType<{
              className?: string;
            }>,
          };
        }

        return { default: FallbackIcon };
      }),
    );
  }, [name]);

  return (
    <Suspense
      fallback={
        <FallbackIcon
          className={clsx(styles.icon, className)}
          data-size={Boolean(size) ? size : undefined}
          {...rest}
        />
      }
    >
      <Icon
        className={clsx(styles.icon, className)}
        data-color={color ? color : undefined}
        data-icon=""
        data-size={Boolean(size) ? size : undefined}
        ref={ref}
        {...rest}
      />
    </Suspense>
  );
};

export const Icon = forwardRef(_Icon);
