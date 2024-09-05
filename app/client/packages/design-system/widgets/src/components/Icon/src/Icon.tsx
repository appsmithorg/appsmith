import type { Component, Ref } from "react";
import React, { Suspense, forwardRef, lazy, useMemo } from "react";
import { useThemeContext } from "@appsmith/wds-theming";

import { ICONS } from "./icons";
import styles from "./styles.module.css";
import type { IconProps } from "./types";
import { FallbackIcon } from "./FallbackIcon";

const _Icon = (props: IconProps, ref: Ref<Component>) => {
  const { color, filled: filledProp, name, size = "medium", ...rest } = props;
  const theme = useThemeContext();
  const filled = theme.iconStyle === "filled" || filledProp;

  const Icon = useMemo(() => {
    const pascalName = ICONS[name];

    return lazy(async () =>
      import("@tabler/icons-react").then((module) => {
        if (Boolean(filled)) {
          const filledVariant = `${pascalName}Filled`;

          if (filledVariant in module) {
            return {
              default: module[filledVariant] as React.ComponentType,
            };
          }
        }

        if (pascalName in module) {
          return {
            default: module[pascalName] as React.ComponentType,
          };
        }

        return { default: FallbackIcon };
      }),
    );
  }, [name, filled]);

  return (
    <Suspense
      fallback={
        <FallbackIcon
          className={styles.icon}
          data-size={Boolean(size) ? size : undefined}
          {...rest}
        />
      }
    >
      <Icon
        className={styles.icon}
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
