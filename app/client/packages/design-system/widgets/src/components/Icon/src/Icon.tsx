import type { Ref } from "react";
import React, { forwardRef } from "react";
import { Icon as HeadlessIcon } from "@design-system/headless";

import styles from "./styles.module.css";
import type { IconProps } from "./types";
import { ICONS } from "./icons";
import { IconLoadFailFallback } from "./loadables";

const _Icon = (props: IconProps, ref: Ref<SVGSVGElement>) => {
  const { icon, name, size = "medium", ...rest } = props;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let Icon: any;

  switch (true) {
    case icon !== undefined:
      Icon = icon;
      break;
    case name !== undefined:
      Icon = ICONS[name as keyof typeof ICONS];
      break;
    default:
      Icon = IconLoadFailFallback;
  }

  Icon;

  return (
    <HeadlessIcon
      className={styles.icon}
      data-icon-button=""
      data-size={size ? size : undefined}
      ref={ref}
      {...rest}
    >
      <Icon />
    </HeadlessIcon>
  );
};

export const Icon = forwardRef(_Icon);
