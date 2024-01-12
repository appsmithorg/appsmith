import type { Ref } from "react";
import React, { Suspense, forwardRef, lazy } from "react";
import { Icon as HeadlessIcon } from "@design-system/headless";

import styles from "./styles.module.css";
import type { IconProps } from "./types";
import { FallbackIcon } from "./FallbackIcon";
import { toPascalCase } from "../../../utils";

const _Icon = (props: IconProps, ref: Ref<SVGSVGElement>) => {
  const { filled, icon, name, size = "medium", ...rest } = props;

  let Icon: React.ComponentType | null = null;

  if (icon !== undefined) {
    Icon = icon as React.ComponentType;
  } else if (name !== undefined) {
    const pascalName = `Icon${toPascalCase(name)}`;

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
        data-icon-button=""
        data-size={size ? size : undefined}
        ref={ref}
        {...rest}
      >
        <Icon {...props} />
      </HeadlessIcon>
    </Suspense>
  );
};

export const Icon = forwardRef(_Icon);
