import type { Ref } from "react";
import React, { Suspense, forwardRef, lazy } from "react";
import { useThemeContext } from "@design-system/theming";
import { Icon as HeadlessIcon } from "@design-system/headless";

import { ICONS } from "./icons";
import styles from "./styles.module.css";
import type { IconProps } from "./types";
import { FallbackIcon } from "./FallbackIcon";

const _Icon = (props: IconProps, ref: Ref<SVGSVGElement>) => {
  const { filled: filledProp, icon, name, size = "medium", ...rest } = props;
  const theme = useThemeContext();
  const filled = theme.iconStyle === "filled" || filledProp;

  let Icon: React.ComponentType | null = null;

  if (icon !== undefined) {
    Icon = icon as React.ComponentType;
  } else if (name !== undefined) {
    const pascalName = ICONS[name];

    Icon = lazy(async () =>
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
  } else {
    Icon = FallbackIcon;
  }

  return (
    <Suspense fallback={<FallbackIcon {...rest} />}>
      <HeadlessIcon
        className={styles.icon}
        data-size={Boolean(size) ? size : undefined}
        ref={ref}
        {...rest}
      >
        <Icon {...props} />
      </HeadlessIcon>
    </Suspense>
  );
};

export const Icon = forwardRef(_Icon);
