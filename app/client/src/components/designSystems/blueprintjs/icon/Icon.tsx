// See readme.md for why this file exists.

import React, { useMemo } from "react";
import classNames from "classnames";
import type { IconProps } from "@blueprintjs/core";
import svgImportsMap from "components/designSystems/blueprintjs/icon/svgImportsMap";
// Below symbols must be imported directly from target files to avoid crashes
// caused by cyclic dependencies in @blueprintjs/core.
import {
  ICON,
  iconClass,
  intentClass,
} from "@blueprintjs/core/lib/esm/common/classes";
import { importSvg } from "@appsmith/ads-old";

// This export must be named "IconSize" to match the exports of @blueprintjs/core/lib/esm/components/icon
export enum IconSize {
  STANDARD = 16,
  LARGE = 20,
}

function Icon(props: IconProps) {
  const {
    icon,
    className,
    color,
    htmlTitle,
    iconSize,
    intent,
    size = iconSize ?? IconSize.STANDARD,
    tagName: TagName = "span",
    ...htmlprops
  } = props;

  // choose which pixel grid is most appropriate for given icon size
  const pixelGridSize =
    size >= IconSize.LARGE ? IconSize.LARGE : IconSize.STANDARD;

  // render the icon, or nothing if icon name is unknown.
  const SvgIcon = useMemo(() => {
    if (typeof icon === "string" && icon in svgImportsMap) {
      return importSvg(svgImportsMap[icon][pixelGridSize]);
    }

    return () => null;
  }, [icon, pixelGridSize]);

  if (icon == null || typeof icon === "boolean") {
    return null;
  } else if (typeof icon !== "string") {
    return icon;
  } else {
    const classes = classNames(
      ICON,
      iconClass(icon),
      intentClass(intent),
      className,
    );

    const viewBox = `0 0 ${pixelGridSize} ${pixelGridSize}`;

    return (
      <TagName
        {...htmlprops}
        className={classes}
        // @ts-expect-error Adding a custom DOM attribute called `icon`, for compatibility with the actual Blueprint icon component.
        // Tests rely on this attribute.
        icon={icon}
        title={htmlTitle}
      >
        <SvgIcon
          data-icon={icon}
          fill={color}
          height={size}
          viewBox={viewBox}
          width={size}
        />
      </TagName>
    );
  }
}

// This export must be named "Icon" to match the exports of @blueprintjs/core/lib/esm/components/icon
export { Icon };
