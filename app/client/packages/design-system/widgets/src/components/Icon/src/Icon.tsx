import type { Ref } from "react";
import React, { Suspense, forwardRef, lazy } from "react";
import { Icon as HeadlessIcon } from "@design-system/headless";

import styles from "./styles.module.css";
import type { IconProps } from "./types";
import { kebabCase, upperFirst } from "lodash";
import { FallbackIcon } from "./FallbackIcon";

const _Icon = (props: IconProps, ref: Ref<SVGSVGElement>) => {
  const { icon, name, size = "medium", ...rest } = props;

  let Icon;

  switch (true) {
    case icon !== undefined:
      Icon = icon;
      break;
    case name !== undefined:
      const pascalName = `Icon${upperFirst(kebabCase(name))}`;

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

  Icon;

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
