import type { ReactElement, ReactNode } from "react";
import type {
  ToggleButtonProps,
  ButtonProps,
  DismissibleTabBarProps,
} from "../..";

export type EntityListButtonProps = Omit<ToggleButtonProps, "icon" | "size">;

export type ToggleScreenModeButtonProps = Omit<
  ButtonProps,
  "isIconButton" | "kind" | "startIcon"
> & {
  isInSplitScreenMode: boolean;
};

type DismissibleTabBarType = ReactElement<DismissibleTabBarProps>;
type EntityListButtonType = ReactElement<EntityListButtonProps>;

export interface EntityTabsHeaderProps {
  children:
    | DismissibleTabBarType
    | [DismissibleTabBarType]
    | [EntityListButtonType, DismissibleTabBarType]
    | [DismissibleTabBarType, ReactNode]
    | [EntityListButtonType, DismissibleTabBarType, ReactNode];
}
