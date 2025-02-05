import type { ReactElement, ReactNode } from "react";

import type { DismissibleTabBarProps } from "../../DismissibleTab";
import type { ToggleButtonProps } from "../../ToggleButton";
import type { ButtonProps } from "../../Button";

export type EntityListButtonProps = Omit<ToggleButtonProps, "icon" | "size">;

export type ToggleScreenModeButtonProps = Omit<
  ButtonProps,
  "isIconButton" | "kind" | "startIcon"
> & {
  isInSplitScreenMode: boolean;
};

type DismissibleTabBarType = ReactElement<DismissibleTabBarProps>;
type EntityListButtonType = ReactElement<EntityListButtonProps>;

/** Required for optional/conditional children. */
type OptionalChild<T> = T | null | false;

export interface EntityTabsHeaderProps {
  children:
    | DismissibleTabBarType
    | [
        OptionalChild<EntityListButtonType>,
        DismissibleTabBarType,
        OptionalChild<ReactNode>,
      ];
}
