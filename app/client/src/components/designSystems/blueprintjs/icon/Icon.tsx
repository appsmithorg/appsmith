// See readme.md for why this file exists.

import React, {
  useEffect,
  useState,
  type ComponentType,
  type SVGProps,
} from "react";
import classNames from "classnames";
import type { IconProps } from "@blueprintjs/core";
// Below symbols must be imported directly from target files to avoid crashes
// caused by cyclic dependencies in @blueprintjs/core.
import {
  ICON,
  iconClass,
  intentClass,
} from "@blueprintjs/core/lib/esm/common/classes";
import { importSvg } from "@appsmith/ads-old";
import type { IconName } from "@blueprintjs/core";

// This export must be named "IconSize" to match the exports of @blueprintjs/core/lib/esm/components/icon
export enum IconSize {
  STANDARD = 16,
  LARGE = 20,
}
type IconMapType = Record<
  IconName,
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  Record<IconSize, () => Promise<typeof import("*.svg")>>
>;

// Create a variable to cache the imported module
let cachedSvgImportsMap: IconMapType | null = null;

// Function to lazily load the file once
const loadSvgImportsMapOnce = async () => {
  if (!cachedSvgImportsMap) {
    const { default: svgImportsMap } = await import(
      "components/designSystems/blueprintjs/icon/svgImportsMap"
    );

    cachedSvgImportsMap = svgImportsMap; // Cache the module for future use
  }

  return cachedSvgImportsMap;
};

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
  const [SvgIcon, setSvgIcon] = useState<ComponentType<
    SVGProps<SVGSVGElement>
  > | null>(null);

  // choose which pixel grid is most appropriate for given icon size
  const pixelGridSize =
    size >= IconSize.LARGE ? IconSize.LARGE : IconSize.STANDARD;

  useEffect(() => {
    const loadScript = async () => {
      // Load the cached svgImportsMap once
      const svgImportsMap = await loadSvgImportsMapOnce();

      if (typeof icon === "string" && icon in svgImportsMap) {
        const SvgIcon = await importSvg(svgImportsMap[icon][pixelGridSize]);

        setSvgIcon(() => SvgIcon); // Set the component as lazy-loaded
      }
    };

    loadScript();

    // Cleanup on unmount
    return () => {
      setSvgIcon(null);
    };
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
        {SvgIcon && (
          <SvgIcon
            data-icon={icon}
            fill={color}
            height={size}
            viewBox={viewBox}
            width={size}
          />
        )}
      </TagName>
    );
  }
}

// This export must be named "Icon" to match the exports of @blueprintjs/core/lib/esm/components/icon
export { Icon };
