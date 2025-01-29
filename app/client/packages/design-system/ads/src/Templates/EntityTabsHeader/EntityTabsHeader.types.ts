import type { ReactElement } from "react";
import type {
  ToggleButtonProps,
  ButtonProps,
  DismissibleTabBarProps,
} from "../..";

export type EntityListButtonProps = Omit<ToggleButtonProps, "icon" | "size">;

export type ToggleScreenModeButtonProps = Omit<
  ButtonProps,
  "isIconButton" | "kind" | "startIcon"
>;

type DismissibleTabBarType = ReactElement<DismissibleTabBarProps>;
type EntityListButtonType = ReactElement<EntityListButtonProps>;
type ToggleScreenModeButtonType = ReactElement<ToggleScreenModeButtonProps>;

export interface EntityTabsHeaderProps {
  children:
    | DismissibleTabBarType
    | [DismissibleTabBarType]
    | [EntityListButtonType, DismissibleTabBarType]
    | [DismissibleTabBarType, ToggleScreenModeButtonType]
    | [EntityListButtonType, DismissibleTabBarType, ToggleScreenModeButtonType];
}
