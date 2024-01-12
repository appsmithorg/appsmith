import type { Ref } from "react";
import React, { Suspense, forwardRef, lazy } from "react";
import { Icon as HeadlessIcon } from "@design-system/headless";

import styles from "./styles.module.css";
import type { IconProps } from "./types";
import { FallbackIcon } from "./FallbackIcon";
import { toPascalCase } from "../../../utils";

const _Icon = (props: IconProps, ref: Ref<SVGSVGElement>) => {
  const { icon, name, size = "medium", ...rest } = props;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let Icon: any;

  switch (true) {
    case icon !== undefined:
      Icon = icon;
      break;
    case Boolean(true):
      const pascalName = `Icon${toPascalCase(name ?? "")}`;

      Icon = lazy(async () =>
        import("@tabler/icons-react").then((module) => {
          if (pascalName in module) {
            return { default: module[pascalName] as React.ComponentType };
          }

          return { default: FallbackIcon };
        }),
      );
      break;
    default:
      Icon = FallbackIcon;
  }

  return (
    <Suspense fallback={<svg {...rest} />}>
      <HeadlessIcon
        className={styles.icon}
        data-icon-button=""
        data-size={size ? size : undefined}
        ref={ref}
        {...rest}
      >
        <Icon />
      </HeadlessIcon>
    </Suspense>
  );
};

export const Icon = forwardRef(_Icon);
