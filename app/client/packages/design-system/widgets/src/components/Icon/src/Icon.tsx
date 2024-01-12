import type { Ref } from "react";
import React, { Suspense, forwardRef, lazy } from "react";
import { Icon as HeadlessIcon } from "@design-system/headless";

import styles from "./styles.module.css";
import type { IconProps } from "./types";
import { FallbackIcon } from "./FallbackIcon";
import { toPascalCase } from "../../../utils";

const _Icon = (props: IconProps, ref: Ref<SVGSVGElement>) => {
  const { icon, name, size = "medium", ...rest } = props;

  let Icon: React.ComponentType | null = null;

  if (icon !== undefined) {
    Icon = icon as React.ComponentType;
  } else if (name !== undefined) {
    const pascalName = `Icon${toPascalCase(name)}`;

    Icon = lazy(async () =>
      import("@tabler/icons-react").then((module) => {
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
    <HeadlessIcon
      className={styles.icon}
      data-icon-button=""
      data-size={size ? size : undefined}
      ref={ref}
      {...rest}
    >
      <Suspense fallback={<FallbackIcon {...rest} />}>
        <Icon {...props} />
      </Suspense>
    </HeadlessIcon>
  );
};

export const Icon = forwardRef(_Icon);
